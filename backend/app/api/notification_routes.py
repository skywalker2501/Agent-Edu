from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.audit import Notification
from app.models.user import User
from app.schemas.audit import NotificationResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=List[NotificationResponse])
async def list_user_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    res = await db.execute(stmt)
    notifs = res.scalars().all()
    return [NotificationResponse.model_validate(n) for n in notifs]


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = select(Notification).where(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    )
    res = await db.execute(stmt)
    notif = res.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
        await db.refresh(notif)
    return NotificationResponse.model_validate(notif)
