from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User
from app.models.classroom import Class
from app.models.assessment import Assessment, Submission
from app.models.intervention import Intervention
from app.models.audit import AuditEvent
from app.schemas.user import UserResponse
from app.schemas.audit import AuditEventResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Administrator Oversight"])


@router.get("/metrics")
async def get_system_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> Dict[str, Any]:
    # Aggregate statistics
    user_cnt = await db.scalar(select(func.count(User.id))) or 0
    student_cnt = await db.scalar(select(func.count(User.id)).where(User.role == "student")) or 0
    teacher_cnt = await db.scalar(select(func.count(User.id)).where(User.role == "teacher")) or 0
    class_cnt = await db.scalar(select(func.count(Class.id))) or 0
    sub_cnt = await db.scalar(select(func.count(Submission.id))) or 0
    interv_cnt = await db.scalar(select(func.count(Intervention.id))) or 0

    return {
        "total_users": user_cnt,
        "students_count": student_cnt,
        "teachers_count": teacher_cnt,
        "classes_count": class_cnt,
        "submissions_analyzed": sub_cnt,
        "interventions_simulated": interv_cnt,
        "ai_provider_status": {
            "configured_provider": settings.AI_PROVIDER,
            "model": settings.LLM_MODEL,
            "has_api_key": bool(settings.LLM_API_KEY),
            "fallback_enabled": settings.AI_FALLBACK_TO_DETERMINISTIC
        },
        "sandbox_status": {
            "enabled": settings.CODE_SANDBOX_ENABLED,
            "timeout_seconds": settings.CODE_SANDBOX_TIMEOUT_SECONDS
        }
    }


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    role: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stmt = select(User).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    res = await db.execute(stmt)
    users = res.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/audit", response_model=List[AuditEventResponse])
async def search_audit_events(
    action: Optional[str] = None,
    actor_id: Optional[str] = None,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stmt = select(AuditEvent).order_by(AuditEvent.created_at.desc()).limit(limit)
    if action:
        stmt = stmt.where(AuditEvent.action == action)
    if actor_id:
        stmt = stmt.where(AuditEvent.actor_id == actor_id)
    res = await db.execute(stmt)
    events = res.scalars().all()
    return [AuditEventResponse.model_validate(e) for e in events]
