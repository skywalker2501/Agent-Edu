import uuid
from datetime import datetime, timezone, date
from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, UniqueConstraint, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class XPLedger(Base):
    """
    Immutable audit ledger for all gamified experience points.
    Every XP award is verified on the server, idempotent via idempotency_key,
    and cannot be arbitrarily manipulated by client requests.
    """
    __tablename__ = "xp_ledgers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Integer, nullable=False)
    action_type = Column(String(50), nullable=False)  # quiz_passed, lesson_complete, streak_bonus, challenge_solved, intervention_retest
    idempotency_key = Column(String(128), unique=True, nullable=False, index=True)
    reference_id = Column(String(100), nullable=True)  # AssessmentAttempt id, GameSession id, etc.
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    __table_args__ = (
        Index("idx_xp_user_created", "user_id", "created_at"),
    )


class Achievement(Base):
    """
    Pedagogical milestones and skill badges.
    """
    __tablename__ = "achievements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(50), unique=True, nullable=False, index=True)
    title = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    badge_icon = Column(String(100), nullable=False, default="trophy")
    category = Column(String(50), nullable=False, default="mastery")  # mastery, consistency, challenge, revision
    xp_reward = Column(Integer, default=50, nullable=False)
    threshold_value = Column(Integer, default=1, nullable=False)


class UserAchievement(Base):
    """
    Tracks which badges have been earned by each user.
    """
    __tablename__ = "user_achievements"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    achievement_id = Column(String(36), ForeignKey("achievements.id", ondelete="CASCADE"), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    progress_value = Column(Integer, default=1, nullable=False)

    achievement = relationship("Achievement")

    __table_args__ = (
        UniqueConstraint("user_id", "achievement_id", name="uq_user_achievement"),
    )


class UserStreak(Base):
    """
    Daily learning consistency tracker.
    Streaks update on verified learning activity.
    """
    __tablename__ = "user_streaks"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_activity_date = Column(Date, nullable=True)
    streak_freeze_count = Column(Integer, default=1, nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
