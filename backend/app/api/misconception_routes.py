from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.learner import Misconception, MisconceptionRelationship, MisconceptionStatus
from app.models.review import TeacherDecision
from app.models.user import User, UserRole
from app.schemas.learner import MisconceptionResponse, MisconceptionStatusUpdate, MisconceptionRelationshipView
from app.api.deps import get_current_user, require_teacher

router = APIRouter(prefix="/misconceptions", tags=["Misconceptions & Root-Cause Diagnosis"])


@router.get("", response_model=List[MisconceptionResponse])
async def list_misconceptions(
    student_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = student_id
    if current_user.role == UserRole.STUDENT:
        target_student_id = current_user.id

    stmt = (
        select(Misconception)
        .options(
            selectinload(Misconception.relationships).selectinload(MisconceptionRelationship.prerequisite_topic)
        )
        .order_by(Misconception.detected_at.desc())
    )
    if target_student_id:
        stmt = stmt.where(Misconception.student_id == target_student_id)
    if status_filter:
        stmt = stmt.where(Misconception.status == status_filter)

    res = await db.execute(stmt)
    misconceptions = res.scalars().all()

    output = []
    for m in misconceptions:
        rel_views = [
            MisconceptionRelationshipView(
                id=r.id,
                prerequisite_topic_id=r.prerequisite_topic_id,
                prerequisite_topic_name=r.prerequisite_topic.name if r.prerequisite_topic else None,
                strength=r.strength,
                explanation=r.explanation
            )
            for r in m.relationships
        ]
        output.append(
            MisconceptionResponse(
                id=m.id,
                student_id=m.student_id,
                topic_id=m.topic_id,
                concept=m.concept,
                root_cause=m.root_cause,
                description=m.description,
                status=m.status,
                confidence=m.confidence,
                evidence_summary=m.evidence_summary,
                supporting_evidence=m.supporting_evidence,
                detected_at=m.detected_at,
                resolved_at=m.resolved_at,
                relationships=rel_views
            )
        )
    return output


@router.get("/all", response_model=List[MisconceptionResponse])
async def list_all_misconceptions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    stmt = (
        select(Misconception)
        .options(
            selectinload(Misconception.relationships).selectinload(MisconceptionRelationship.prerequisite_topic)
        )
        .order_by(Misconception.detected_at.desc())
    )
    res = await db.execute(stmt)
    misconceptions = res.scalars().all()

    output = []
    for m in misconceptions:
        rel_views = [
            MisconceptionRelationshipView(
                id=r.id,
                prerequisite_topic_id=r.prerequisite_topic_id,
                prerequisite_topic_name=r.prerequisite_topic.name if r.prerequisite_topic else None,
                strength=r.strength,
                explanation=r.explanation
            )
            for r in m.relationships
        ]
        output.append(
            MisconceptionResponse(
                id=m.id,
                student_id=m.student_id,
                topic_id=m.topic_id,
                concept=m.concept,
                root_cause=m.root_cause,
                description=m.description,
                status=m.status,
                confidence=m.confidence,
                evidence_summary=m.evidence_summary,
                supporting_evidence=m.supporting_evidence,
                detected_at=m.detected_at,
                resolved_at=m.resolved_at,
                relationships=rel_views
            )
        )
    return output


@router.patch("/{misconception_id}/status", response_model=MisconceptionResponse)
async def update_misconception_status(
    misconception_id: str,
    payload: MisconceptionStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    stmt = (
        select(Misconception)
        .where(Misconception.id == misconception_id)
        .options(
            selectinload(Misconception.relationships).selectinload(MisconceptionRelationship.prerequisite_topic)
        )
    )
    res = await db.execute(stmt)
    misc = res.scalar_one_or_none()
    if not misc:
        raise ResourceNotFoundError("Misconception", misconception_id)

    old_status = misc.status
    misc.status = payload.status

    # Record teacher decision audit log
    decision = TeacherDecision(
        teacher_id=current_user.id,
        entity_type="misconception",
        entity_id=misc.id,
        decision_type="update_misconception_status",
        original_state={"status": old_status},
        new_state={"status": misc.status},
        justification=payload.teacher_notes or f"Status changed from {old_status} to {misc.status} by teacher."
    )
    db.add(decision)
    await db.commit()
    await db.refresh(misc)

    rel_views = [
        MisconceptionRelationshipView(
            id=r.id,
            prerequisite_topic_id=r.prerequisite_topic_id,
            prerequisite_topic_name=r.prerequisite_topic.name if r.prerequisite_topic else None,
            strength=r.strength,
            explanation=r.explanation
        )
        for r in misc.relationships
    ]

    return MisconceptionResponse(
        id=misc.id,
        student_id=misc.student_id,
        topic_id=misc.topic_id,
        concept=misc.concept,
        root_cause=misc.root_cause,
        description=misc.description,
        status=misc.status,
        confidence=misc.confidence,
        evidence_summary=misc.evidence_summary,
        supporting_evidence=misc.supporting_evidence,
        detected_at=misc.detected_at,
        resolved_at=misc.resolved_at,
        relationships=rel_views
    )
