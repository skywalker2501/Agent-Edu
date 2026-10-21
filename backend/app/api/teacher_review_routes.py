from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.review import TeacherReview, TeacherDecision, MethodReviewOutcome
from app.models.assessment import Submission, SubmissionAnswer, GradingResult, Question
from app.models.user import User, UserRole
from app.schemas.review import (
    TeacherReviewResponse, MethodReviewDecisionRequest,
    TeacherDecisionResponse, MultiApproachSuggestionResponse
)
from app.orchestrator.multi_approach_engine import MultiApproachAndOutcomeEngine
from app.api.deps import require_teacher

router = APIRouter(prefix="/teacher-reviews", tags=["Intelligent Teacher Review Module"])


@router.get("", response_model=List[TeacherReviewResponse])
async def list_review_queue(
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    stmt = (
        select(TeacherReview)
        .options(
            selectinload(TeacherReview.teacher),
            selectinload(TeacherReview.submission).selectinload(Submission.attempt)
        )
        .order_by(TeacherReview.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(TeacherReview.status == status_filter)

    res = await db.execute(stmt)
    reviews = res.scalars().all()

    output = []
    for r in reviews:
        output.append(
            TeacherReviewResponse(
                id=r.id,
                submission_id=r.submission_id,
                teacher_id=r.teacher_id,
                teacher_name=r.teacher.full_name if r.teacher else None,
                status=r.status,
                method_review_outcome=r.method_review_outcome,
                ai_evaluation=r.ai_evaluation,
                ai_suggested_marks=r.ai_suggested_marks,
                teacher_comments=r.teacher_comments,
                marks_awarded=r.marks_awarded,
                is_alternative_accepted=r.is_alternative_accepted,
                alternative_approach_name=r.alternative_approach_name,
                created_at=r.created_at,
                reviewed_at=r.reviewed_at
            )
        )
    return output


@router.get("/suggest-approaches/{question_id}", response_model=MultiApproachSuggestionResponse)
async def get_multi_approach_suggestions(
    question_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    stmt = select(Question).where(Question.id == question_id)
    res = await db.execute(stmt)
    q = res.scalar_one_or_none()
    if not q:
        raise ResourceNotFoundError("Question", question_id)

    return await MultiApproachAndOutcomeEngine.suggest_solution_approaches(
        question_id=q.id,
        question_title=q.title,
        question_prompt=q.prompt
    )


@router.get("/{review_id}", response_model=TeacherReviewResponse)
async def get_review_workspace(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    stmt = (
        select(TeacherReview)
        .where(TeacherReview.id == review_id)
        .options(
            selectinload(TeacherReview.teacher),
            selectinload(TeacherReview.submission).selectinload(Submission.answers)
        )
    )
    res = await db.execute(stmt)
    r = res.scalar_one_or_none()
    if not r:
        raise ResourceNotFoundError("TeacherReview", review_id)

    return TeacherReviewResponse(
        id=r.id,
        submission_id=r.submission_id,
        teacher_id=r.teacher_id,
        teacher_name=r.teacher.full_name if r.teacher else None,
        status=r.status,
        method_review_outcome=r.method_review_outcome,
        ai_evaluation=r.ai_evaluation,
        ai_suggested_marks=r.ai_suggested_marks,
        teacher_comments=r.teacher_comments,
        marks_awarded=r.marks_awarded,
        is_alternative_accepted=r.is_alternative_accepted,
        alternative_approach_name=r.alternative_approach_name,
        created_at=r.created_at,
        reviewed_at=r.reviewed_at
    )


@router.post("/{review_id}/decision", response_model=TeacherReviewResponse)
async def make_review_decision(
    review_id: str,
    payload: MethodReviewDecisionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher solution review decision:
    - Accepts alternative methods
    - Adjusts marks or awards partial credit
    - Stores immutable decision history record
    - Updates grading total if marks adjusted
    """
    stmt = (
        select(TeacherReview)
        .where(TeacherReview.id == review_id)
        .options(
            selectinload(TeacherReview.submission).selectinload(Submission.grading_result),
            selectinload(TeacherReview.submission).selectinload(Submission.answers)
        )
    )
    res = await db.execute(stmt)
    r = res.scalar_one_or_none()
    if not r:
        raise ResourceNotFoundError("TeacherReview", review_id)

    old_state = {
        "status": r.status,
        "method_review_outcome": r.method_review_outcome,
        "marks_awarded": r.marks_awarded,
        "is_alternative_accepted": r.is_alternative_accepted
    }

    r.teacher_id = current_user.id
    r.status = "completed"
    r.method_review_outcome = payload.method_review_outcome
    r.teacher_comments = payload.teacher_comments
    r.marks_awarded = payload.marks_awarded
    r.is_alternative_accepted = payload.is_alternative_accepted
    r.alternative_approach_name = payload.alternative_approach_name
    r.reviewed_at = datetime.now(timezone.utc)

    # If marks are adjusted or alternative accepted, update submission answer & grading
    if r.submission and r.submission.answers:
        primary_ans = r.submission.answers[0]
        primary_ans.score_awarded = payload.marks_awarded
        if payload.is_alternative_accepted or payload.method_review_outcome in [
            MethodReviewOutcome.CORRECT_METHOD_AND_ANSWER,
            MethodReviewOutcome.CORRECT_ALTERNATIVE_METHOD
        ]:
            primary_ans.is_correct = True
            primary_ans.automated_feedback = f"Teacher Verified: {payload.teacher_comments}"

        if r.submission.grading_result:
            gr = r.submission.grading_result
            # recalculate total
            new_total = sum(a.score_awarded for a in r.submission.answers)
            gr.total_score = new_total
            gr.percentage = round((new_total / gr.max_score * 100.0), 1) if gr.max_score > 0 else 0.0
            gr.passed = gr.percentage >= 60.0

    # Record TeacherDecision in audit history
    decision = TeacherDecision(
        teacher_id=current_user.id,
        entity_type="submission",
        entity_id=r.submission_id,
        decision_type="method_review_override",
        original_state=old_state,
        new_state={
            "status": r.status,
            "method_review_outcome": r.method_review_outcome,
            "marks_awarded": r.marks_awarded,
            "is_alternative_accepted": r.is_alternative_accepted
        },
        justification=payload.teacher_comments
    )
    db.add(decision)
    await db.commit()
    await db.refresh(r)

    return TeacherReviewResponse(
        id=r.id,
        submission_id=r.submission_id,
        teacher_id=r.teacher_id,
        teacher_name=current_user.full_name,
        status=r.status,
        method_review_outcome=r.method_review_outcome,
        ai_evaluation=r.ai_evaluation,
        ai_suggested_marks=r.ai_suggested_marks,
        teacher_comments=r.teacher_comments,
        marks_awarded=r.marks_awarded,
        is_alternative_accepted=r.is_alternative_accepted,
        alternative_approach_name=r.alternative_approach_name,
        created_at=r.created_at,
        reviewed_at=r.reviewed_at
    )
