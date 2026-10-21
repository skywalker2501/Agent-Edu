from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError, GovernanceViolationError
from app.models.intervention import (
    Intervention, InterventionCandidate, InterventionVersion,
    InterventionStatus, TeacherReviewStatus
)
from app.models.review import TeacherDecision
from app.models.audit import Notification
from app.models.user import User, UserRole
from app.schemas.intervention import (
    InterventionResponse, InterventionCandidateResponse,
    InterventionVersionResponse, InterventionApprovalRequest
)
from app.agents.governance_agent import GovernanceAgent
from app.api.deps import get_current_user, require_teacher

router = APIRouter(prefix="/interventions", tags=["Interventions & Simulator"])


def serialize_candidate(c: InterventionCandidate, rank_idx: int = 1) -> InterventionCandidateResponse:
    score_val = (c.ranking_score / 100.0) if (c.ranking_score and c.ranking_score > 1.0) else (c.ranking_score or 0.8)
    benefit_label = "High Estimated Benefit (Simulated)" if (c.expected_benefit_score and c.expected_benefit_score >= 0.8) else "Moderate Estimated Benefit"
    concept = getattr(c.intervention, "target_concept", None) if hasattr(c, "intervention") and c.intervention else None

    return InterventionCandidateResponse(
        id=c.id,
        strategy=c.strategy,
        title=c.title,
        intended_objective=c.intended_objective,
        reason=c.reason,
        supporting_evidence=c.supporting_evidence,
        estimated_effort_minutes=c.estimated_effort_minutes,
        difficulty=c.difficulty,
        expected_benefit_score=c.expected_benefit_score,
        uncertainty=c.uncertainty,
        ranking_score=c.ranking_score,
        is_recommended=c.is_recommended,
        content_preview=c.content_preview,
        intervention_id=c.intervention_id,
        description=c.intended_objective or c.content_preview or c.title,
        target_concept=concept or "Recursion & Call Stack",
        rationale=c.reason,
        estimated_time_minutes=c.estimated_effort_minutes,
        score=round(score_val, 2),
        ranking=rank_idx,
        evidence_strength=round(1.0 - (c.uncertainty or 0.15), 2),
        expected_benefit_label=benefit_label
    )


@router.get("", response_model=List[InterventionResponse])
async def list_interventions(
    student_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = student_id
    if current_user.role == UserRole.STUDENT:
        target_student_id = current_user.id

    stmt = (
        select(Intervention)
        .options(
            selectinload(Intervention.target_topic),
            selectinload(Intervention.candidates),
            selectinload(Intervention.versions)
        )
        .order_by(Intervention.created_at.desc())
    )
    if target_student_id:
        stmt = stmt.where(Intervention.student_id == target_student_id)
    if status_filter:
        stmt = stmt.where(Intervention.status == status_filter)

    res = await db.execute(stmt)
    interventions = res.scalars().all()

    output = []
    for it in interventions:
        candidates_resp = [
            serialize_candidate(c, idx + 1) for idx, c in enumerate(it.candidates)
        ]
        curr_ver = it.versions[-1] if it.versions else None
        v_resp = InterventionVersionResponse.model_validate(curr_ver) if curr_ver else None

        output.append(
            InterventionResponse(
                id=it.id,
                student_id=it.student_id,
                target_concept=it.target_concept,
                target_topic_id=it.target_topic_id,
                target_topic_name=it.target_topic.name if it.target_topic else None,
                selected_strategy=it.selected_strategy,
                reason=it.reason,
                confidence=it.confidence,
                expected_goal=it.expected_goal,
                status=it.status,
                teacher_status=it.teacher_status,
                current_version_num=it.current_version_num,
                trigger_assessment_id=it.trigger_assessment_id,
                reassessment_id=it.reassessment_id,
                created_at=it.created_at,
                approved_at=it.approved_at,
                completed_at=it.completed_at,
                candidates=candidates_resp,
                current_version=v_resp
            )
        )
    return output


@router.get("/candidates", response_model=List[InterventionCandidateResponse])
async def list_intervention_candidates(
    intervention_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(InterventionCandidate)
        .options(selectinload(InterventionCandidate.intervention))
        .order_by(InterventionCandidate.ranking_score.desc())
    )
    if intervention_id:
        stmt = stmt.where(InterventionCandidate.intervention_id == intervention_id)

    res = await db.execute(stmt)
    candidates = res.scalars().all()
    return [serialize_candidate(c, idx + 1) for idx, c in enumerate(candidates)]


@router.get("/{intervention_id}", response_model=InterventionResponse)
async def get_intervention(
    intervention_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Intervention)
        .where(Intervention.id == intervention_id)
        .options(
            selectinload(Intervention.target_topic),
            selectinload(Intervention.candidates),
            selectinload(Intervention.versions)
        )
    )
    res = await db.execute(stmt)
    it = res.scalar_one_or_none()
    if not it:
        # Check if intervention_id was actually a candidate id
        cand_stmt = select(InterventionCandidate).where(InterventionCandidate.id == intervention_id)
        cand_res = await db.execute(cand_stmt)
        cand = cand_res.scalar_one_or_none()
        if cand:
            it = (
                await db.execute(
                    select(Intervention)
                    .where(Intervention.id == cand.intervention_id)
                    .options(
                        selectinload(Intervention.target_topic),
                        selectinload(Intervention.candidates),
                        selectinload(Intervention.versions)
                    )
                )
            ).scalar_one_or_none()

    if not it:
        raise ResourceNotFoundError("Intervention", intervention_id)

    if current_user.role == UserRole.STUDENT and it.student_id != current_user.id:
        raise PermissionDeniedError("Cannot view another student's intervention")

    candidates_resp = [
        serialize_candidate(c, idx + 1) for idx, c in enumerate(it.candidates)
    ]
    curr_ver = it.versions[-1] if it.versions else None
    v_resp = InterventionVersionResponse.model_validate(curr_ver) if curr_ver else None

    return InterventionResponse(
        id=it.id,
        student_id=it.student_id,
        target_concept=it.target_concept,
        target_topic_id=it.target_topic_id,
        target_topic_name=it.target_topic.name if it.target_topic else None,
        selected_strategy=it.selected_strategy,
        reason=it.reason,
        confidence=it.confidence,
        expected_goal=it.expected_goal,
        status=it.status,
        teacher_status=it.teacher_status,
        current_version_num=it.current_version_num,
        trigger_assessment_id=it.trigger_assessment_id,
        reassessment_id=it.reassessment_id,
        created_at=it.created_at,
        approved_at=it.approved_at,
        completed_at=it.completed_at,
        candidates=candidates_resp,
        current_version=v_resp
    )


@router.post("/{intervention_id}/review", response_model=InterventionResponse)
async def teacher_review_intervention(
    intervention_id: str,
    payload: InterventionApprovalRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """
    Teacher review actions: 'approve', 'modify', 'reject', or 'request_evidence'.
    Preserves versioned history and original proposal.
    """
    stmt = (
        select(Intervention)
        .where(Intervention.id == intervention_id)
        .options(
            selectinload(Intervention.target_topic),
            selectinload(Intervention.candidates),
            selectinload(Intervention.versions)
        )
    )
    res = await db.execute(stmt)
    it = res.scalar_one_or_none()
    if not it:
        # Check if intervention_id is an intervention candidate ID
        cand_stmt = select(InterventionCandidate).where(InterventionCandidate.id == intervention_id)
        cand_res = await db.execute(cand_stmt)
        cand = cand_res.scalar_one_or_none()
        if cand:
            it = (
                await db.execute(
                    select(Intervention)
                    .where(Intervention.id == cand.intervention_id)
                    .options(
                        selectinload(Intervention.target_topic),
                        selectinload(Intervention.candidates),
                        selectinload(Intervention.versions)
                    )
                )
            ).scalar_one_or_none()
            if it and not payload.selected_candidate_id:
                payload.selected_candidate_id = cand.id
                it.selected_strategy = cand.strategy

    if not it:
        raise ResourceNotFoundError("Intervention", intervention_id)

    old_status = it.status
    old_teacher_status = it.teacher_status
    action = payload.action.lower()

    if action == "approve":
        it.status = InterventionStatus.APPROVED
        it.teacher_status = TeacherReviewStatus.APPROVED
        it.approved_at = datetime.now(timezone.utc)

        # Notify student
        notif = Notification(
            user_id=it.student_id,
            title="Personalized Learning Activity Approved! 🚀",
            message=f"Your teacher has approved your learning activity for {it.target_concept}. You can now begin.",
            notification_type="intervention_approved",
            link_url=f"/student/interventions/{it.id}/player"
        )
        db.add(notif)

    elif action == "modify":
        it.status = InterventionStatus.MODIFIED
        it.teacher_status = TeacherReviewStatus.MODIFIED
        it.approved_at = datetime.now(timezone.utc)
        if payload.modified_strategy:
            it.selected_strategy = payload.modified_strategy

        # Create Version 2 with teacher modifications
        it.current_version_num += 1
        new_v = InterventionVersion(
            intervention_id=it.id,
            version_num=it.current_version_num,
            title=payload.modified_title or f"Customized Plan: {it.target_concept}",
            strategy=it.selected_strategy,
            content=payload.modified_content or {
                "steps": [
                    {"step_num": 1, "title": "Teacher Prescribed Worked Example", "type": "worked_example"},
                    {"step_num": 2, "title": "Targeted Guided Practice Set", "type": "practice"}
                ]
            },
            created_by_role="teacher",
            author_id=current_user.id,
            change_notes=payload.teacher_comments or "Modified sequence and instructional priority by teacher"
        )
        db.add(new_v)

        notif = Notification(
            user_id=it.student_id,
            title="Learning Activity Tailored by Teacher",
            message=f"Your teacher customized a personalized learning sequence for {it.target_concept}.",
            notification_type="intervention_approved",
            link_url=f"/student/interventions/{it.id}/player"
        )
        db.add(notif)

    elif action == "reject":
        it.status = InterventionStatus.REJECTED
        it.teacher_status = TeacherReviewStatus.REJECTED

    # Record TeacherDecision
    decision = TeacherDecision(
        teacher_id=current_user.id,
        entity_type="intervention",
        entity_id=it.id,
        decision_type=f"intervention_{action}",
        original_state={"status": old_status, "teacher_status": old_teacher_status},
        new_state={"status": it.status, "teacher_status": it.teacher_status, "strategy": it.selected_strategy},
        justification=payload.teacher_comments or f"Teacher executed {action} action on intervention {it.id}."
    )
    db.add(decision)
    await db.commit()
    await db.refresh(it)

    return await get_intervention(it.id, db, current_user)


@router.post("/{intervention_id}/complete", response_model=InterventionResponse)
async def complete_intervention(
    intervention_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Called by student when they complete the approved intervention activity.
    Marks status as 'completed' and informs the student that a linked reassessment is ready.
    """
    stmt = (
        select(Intervention)
        .where(Intervention.id == intervention_id)
        .options(
            selectinload(Intervention.target_topic),
            selectinload(Intervention.candidates),
            selectinload(Intervention.versions)
        )
    )
    res = await db.execute(stmt)
    it = res.scalar_one_or_none()
    if not it:
        raise ResourceNotFoundError("Intervention", intervention_id)

    if current_user.role == UserRole.STUDENT and it.student_id != current_user.id:
        raise PermissionDeniedError("Cannot modify another student's intervention")

    it.status = InterventionStatus.COMPLETED
    it.completed_at = datetime.now(timezone.utc)

    # Add notification that reassessment is available
    notif = Notification(
        user_id=it.student_id,
        title="Intervention Completed! Take Your Reassessment",
        message=f"Great job finishing the learning activity for {it.target_concept}. Take the short follow-up assessment to demonstrate your updated mastery.",
        notification_type="reassessment_ready",
        link_url=f"/student/assessments"
    )
    db.add(notif)
    await db.commit()
    await db.refresh(it)

    return await get_intervention(it.id, db, current_user)
