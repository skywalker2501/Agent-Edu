from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from app.core.database import get_db
from app.core.config import settings
from app.models.user import User, UserRole, UserStatus
from app.models.classroom import Class
from app.models.assessment import Assessment, Submission
from app.models.intervention import Intervention
from app.models.audit import AuditEvent
from app.schemas.user import UserResponse
from app.schemas.audit import AuditEventResponse
from app.api.deps import require_admin

router = APIRouter(prefix="/admin", tags=["Administrator Oversight"])


class UpdateStatusRequest(BaseModel):
    status: str  # active, suspended
    reason: Optional[str] = None


class UpdateRoleRequest(BaseModel):
    role: str  # student, teacher, admin


@router.get("/metrics")
async def get_system_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
) -> Dict[str, Any]:
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
            "ollama_base_url": settings.OLLAMA_BASE_URL,
            "ollama_model": settings.OLLAMA_MODEL,
            "has_gemini_key": bool(settings.GEMINI_API_KEY or settings.LLM_API_KEY),
            "fallback_enabled": settings.AI_FALLBACK_TO_DETERMINISTIC
        },
        "sandbox_status": {
            "enabled": settings.CODE_SANDBOX_ENABLED,
            "timeout_seconds": settings.CODE_SANDBOX_TIMEOUT_SECONDS,
            "supported_languages": ["java", "python"]
        }
    }


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    stmt = select(User).where(User.status != UserStatus.DELETED).order_by(User.created_at.desc())
    if role:
        stmt = stmt.where(User.role == role)
    if status:
        stmt = stmt.where(User.status == status)
    if search:
        search_filter = f"%{search.strip()}%"
        stmt = stmt.where(or_(User.email.ilike(search_filter), User.full_name.ilike(search_filter)))

    res = await db.execute(stmt)
    users = res.scalars().all()
    return [UserResponse.model_validate(u) for u in users]


@router.put("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: str,
    payload: UpdateStatusRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Suspends or reactivates an account with reason and audit logging."""
    target_user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id and payload.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=400, detail="Cannot suspend your own administrator account")

    new_status = payload.status.lower()
    if new_status not in [UserStatus.ACTIVE, UserStatus.SUSPENDED]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be 'active' or 'suspended'.")

    old_status = target_user.status
    target_user.status = new_status
    if new_status == UserStatus.SUSPENDED:
        target_user.suspended_reason = payload.reason or "Administrative suspension"
        target_user.suspended_at = datetime.now(timezone.utc)
    else:
        target_user.suspended_reason = None
        target_user.suspended_at = None

    # Audit event
    db.add(AuditEvent(
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="USER_STATUS_CHANGE",
        target_type="user",
        target_id=target_user.id,
        details={
            "old_status": old_status,
            "new_status": new_status,
            "reason": payload.reason
        }
    ))

    await db.commit()
    await db.refresh(target_user)
    return UserResponse.model_validate(target_user)


@router.put("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    payload: UpdateRoleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Changes user role. Protects against removing the last active administrator."""
    target_user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    new_role = payload.role.lower()
    if new_role not in [UserRole.STUDENT, UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=400, detail="Invalid role specified")

    # Safety: check if demoting the last admin
    if target_user.role == UserRole.ADMIN and new_role != UserRole.ADMIN:
        admin_count = await db.scalar(
            select(func.count(User.id)).where(User.role == UserRole.ADMIN, User.status == UserStatus.ACTIVE)
        )
        if admin_count <= 1:
            raise HTTPException(status_code=400, detail="Cannot demote the system's final active administrator")

    old_role = target_user.role
    target_user.role = new_role

    db.add(AuditEvent(
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="USER_ROLE_CHANGE",
        target_type="user",
        target_id=target_user.id,
        details={"old_role": old_role, "new_role": new_role}
    ))

    await db.commit()
    await db.refresh(target_user)
    return UserResponse.model_validate(target_user)


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
async def delete_user_account(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Safely soft-deletes/anonymizes a user account with audit trail."""
    target_user = (await db.execute(select(User).where(User.id == user_id))).scalar_one_or_none()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    if target_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account")

    target_user.status = UserStatus.DELETED
    target_user.deleted_at = datetime.now(timezone.utc)
    target_user.email = f"deleted_{uuid.uuid4().hex[:8]}@anonymized.local"
    target_user.full_name = "Deleted User"

    db.add(AuditEvent(
        actor_id=current_user.id,
        actor_role=current_user.role,
        action="USER_ACCOUNT_DELETED",
        target_type="user",
        target_id=user_id,
        details={"action": "soft_delete_anonymize"}
    ))

    await db.commit()
    return {"message": "User account successfully anonymized and deleted"}


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
