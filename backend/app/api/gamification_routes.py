from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.models.user import User
from app.api.deps import get_current_user, get_current_user_optional
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/gamification", tags=["Gamification & Leaderboard"])


@router.get("/profile")
async def get_gamification_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the authenticated user's XP, level, badges, streak, and recent XP entries."""
    profile = await GamificationService.get_user_gamification_profile(db, current_user.id)
    return profile


@router.get("/leaderboard")
async def get_leaderboard(
    timeframe: str = Query("all_time", description="weekly, monthly, or all_time"),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Returns the server-validated leaderboard with privacy-preserving display names.
    Includes the student's rank and distance to the next rank.
    """
    user_id = current_user.id if current_user else None
    res = await GamificationService.get_leaderboard(
        db=db,
        timeframe=timeframe,
        current_user_id=user_id,
        limit=limit
    )
    return res

