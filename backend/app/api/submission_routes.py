from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError, DuplicateSubmissionError
from app.models.assessment import (
    Assessment, AssessmentQuestion, AssessmentAttempt,
    Submission, SubmissionAnswer, GradingResult, Question
)
from app.models.user import User, UserRole
from app.schemas.assessment import (
    AssessmentSubmissionRequest, AssessmentResultResponse,
    GradingResultResponse, SubmissionAnswerResponse
)
from app.services.scoring_service import ScoringService
from app.orchestrator.state_machine import WorkflowOrchestrator
from app.api.deps import get_current_user

router = APIRouter(prefix="/submissions", tags=["Assessment Submissions & Scoring"])


@router.post("", response_model=AssessmentResultResponse, status_code=status.HTTP_201_CREATED)
async def submit_assessment(
    payload: AssessmentSubmissionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student_id = current_user.id

    # 1. Verify Assessment exists
    stmt_ass = (
        select(Assessment)
        .where(Assessment.id == payload.assessment_id)
        .options(selectinload(Assessment.questions).selectinload(AssessmentQuestion.question))
    )
    res_ass = await db.execute(stmt_ass)
    assessment = res_ass.scalar_one_or_none()
    if not assessment:
        raise ResourceNotFoundError("Assessment", payload.assessment_id)

    # 2. Idempotency Check
    if payload.idempotency_key:
        stmt_idem = select(AssessmentAttempt).where(AssessmentAttempt.idempotency_key == payload.idempotency_key)
        res_idem = await db.execute(stmt_idem)
        existing_attempt = res_idem.scalar_one_or_none()
        if existing_attempt and existing_attempt.status in ["submitted", "graded"]:
            # Retrieve submission and return existing result
            stmt_sub = select(Submission).where(Submission.attempt_id == existing_attempt.id)
            res_sub = await db.execute(stmt_sub)
            existing_sub = res_sub.scalar_one_or_none()
            if existing_sub:
                return await get_submission_result_helper(existing_sub.id, db, current_user)

    # 3. Create or update AssessmentAttempt
    attempt = None
    if payload.attempt_id:
        stmt_att = select(AssessmentAttempt).where(AssessmentAttempt.id == payload.attempt_id)
        res_att = await db.execute(stmt_att)
        attempt = res_att.scalar_one_or_none()
        if attempt and attempt.status in ["submitted", "graded"]:
            raise DuplicateSubmissionError(attempt.id)

    if not attempt:
        attempt = AssessmentAttempt(
            assessment_id=assessment.id,
            student_id=student_id,
            status="submitted",
            start_time=datetime.now(timezone.utc),
            submit_time=datetime.now(timezone.utc),
            idempotency_key=payload.idempotency_key
        )
        db.add(attempt)
        await db.flush()
    else:
        attempt.status = "submitted"
        attempt.submit_time = datetime.now(timezone.utc)

    # 4. Map questions and points
    questions_map = {}
    points_map = {}
    for aq in assessment.questions:
        if aq.question:
            questions_map[aq.question_id] = aq.question
            points_map[aq.question_id] = aq.points

    # 5. Objective Server-Side Scoring
    answers_data = [item.model_dump() for item in payload.answers]
    graded_answers, total_score, max_score, topic_breakdown = await ScoringService.grade_submission(
        questions_map=questions_map,
        answers_payload=answers_data,
        points_map=points_map
    )

    percentage = round((total_score / max_score * 100.0), 1) if max_score > 0 else 0.0
    passed = percentage >= assessment.passing_score

    attempt.score = total_score
    attempt.max_score = max_score
    attempt.percentage = percentage
    attempt.passed = passed
    attempt.status = "graded"

    # 6. Create Submission and Answers
    submission = Submission(
        attempt_id=attempt.id,
        student_id=student_id,
        assessment_id=assessment.id,
        status="analyzed"
    )
    db.add(submission)
    await db.flush()

    for ga in graded_answers:
        sa = SubmissionAnswer(
            submission_id=submission.id,
            question_id=ga["question_id"],
            student_answer=ga["student_answer"],
            code_language=ga.get("code_language"),
            is_correct=ga["is_correct"],
            score_awarded=ga["score_awarded"],
            max_score=ga["max_score"],
            automated_feedback=ga["automated_feedback"],
            execution_results=ga.get("execution_results")
        )
        db.add(sa)

    grading = GradingResult(
        submission_id=submission.id,
        total_score=total_score,
        max_score=max_score,
        percentage=percentage,
        passed=passed,
        topic_breakdown=topic_breakdown
    )
    db.add(grading)
    await db.commit()

    # 7. Check if this is a Reassessment linked to an Intervention
    if assessment.assessment_type == "reassessment" and assessment.linked_intervention_id:
        await WorkflowOrchestrator.process_reassessment_outcome(
            db=db,
            intervention_id=assessment.linked_intervention_id,
            reassessment_attempt_id=attempt.id
        )
    else:
        # Initial or Diagnostic Assessment -> trigger the 6 agents via Orchestrator pipeline
        await WorkflowOrchestrator.process_submission_pipeline(
            db=db,
            submission_id=submission.id
        )

    return await get_submission_result_helper(submission.id, db, current_user)


@router.get("/{submission_id}", response_model=AssessmentResultResponse)
async def get_submission(
    submission_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await get_submission_result_helper(submission_id, db, current_user)


async def get_submission_result_helper(submission_id: str, db: AsyncSession, current_user: User) -> AssessmentResultResponse:
    stmt = (
        select(Submission)
        .where(Submission.id == submission_id)
        .options(
            selectinload(Submission.attempt),
            selectinload(Submission.grading_result),
            selectinload(Submission.answers)
        )
    )
    res = await db.execute(stmt)
    sub = res.scalar_one_or_none()
    if not sub:
        raise ResourceNotFoundError("Submission", submission_id)

    # Authorization check
    if current_user.role == UserRole.STUDENT and sub.student_id != current_user.id:
        raise PermissionDeniedError("Cannot access another student's submission")

    grading = sub.grading_result
    answers_resp = [
        SubmissionAnswerResponse(
            id=a.id,
            question_id=a.question_id,
            student_answer=a.student_answer,
            code_language=a.code_language,
            is_correct=a.is_correct,
            score_awarded=a.score_awarded,
            max_score=a.max_score,
            automated_feedback=a.automated_feedback,
            execution_results=a.execution_results
        )
        for a in sub.answers
    ]

    return AssessmentResultResponse(
        submission_id=sub.id,
        attempt_id=sub.attempt_id,
        assessment_id=sub.assessment_id,
        student_id=sub.student_id,
        status=sub.status,
        submitted_at=sub.submitted_at,
        grading=GradingResultResponse.model_validate(grading),
        answers=answers_resp,
        next_action_recommendation="Intervention candidates prepared for teacher review." if not grading.passed else "Objective achieved."
    )
