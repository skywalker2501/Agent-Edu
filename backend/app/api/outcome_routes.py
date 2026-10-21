from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.intervention import InterventionOutcome
from app.models.review import TeacherDecision
from app.models.user import User, UserRole
from app.schemas.intervention import InterventionOutcomeResponse
from app.schemas.review import TeacherDecisionResponse
from app.api.deps import get_current_user, require_teacher

router = APIRouter(prefix="/outcomes", tags=["Outcome Monitoring & Decision History"])


@router.get("", response_model=List[InterventionOutcomeResponse])
async def list_outcomes(
    student_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = student_id
    if current_user.role == UserRole.STUDENT:
        target_student_id = current_user.id

    stmt = select(InterventionOutcome).order_by(InterventionOutcome.measured_at.desc())
    if target_student_id:
        stmt = stmt.where(InterventionOutcome.student_id == target_student_id)

    res = await db.execute(stmt)
    outcomes = res.scalars().all()
    return [InterventionOutcomeResponse.model_validate(o) for o in outcomes]


@router.get("/decisions", response_model=List[TeacherDecisionResponse])
async def list_decision_history(
    teacher_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    stmt = (
        select(TeacherDecision)
        .order_by(TeacherDecision.created_at.desc())
        .limit(100)
    )
    if teacher_id:
        stmt = stmt.where(TeacherDecision.teacher_id == teacher_id)

    res = await db.execute(stmt)
    decisions = res.scalars().all()
    return [TeacherDecisionResponse.model_validate(d) for d in decisions]
