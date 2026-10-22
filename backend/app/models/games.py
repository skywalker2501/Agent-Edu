import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from app.core.database import Base


class GameType(str):
    QUIZ_BATTLE = "quiz_battle"
    CONCEPT_MATCH = "concept_match"
    CODE_QUEST = "code_quest"
    FLASHCARD_SPRINT = "flashcard_sprint"
    ADAPTIVE_CHALLENGE = "adaptive_challenge"


class GameStatus(str):
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class GameSession(Base):
    """
    Tracks an interactive learning game session.
    All scores, accuracy, and XP awards are validated server-side.
    """
    __tablename__ = "game_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    game_type = Column(String(50), nullable=False, index=True)  # GameType enum
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), nullable=False, default=GameStatus.IN_PROGRESS)
    
    score = Column(Integer, default=0, nullable=False)
    accuracy = Column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    time_taken_seconds = Column(Integer, default=0, nullable=False)
    xp_awarded = Column(Integer, default=0, nullable=False)
    summary_json = Column(JSON, default=dict, nullable=False)

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    topic = relationship("Topic")


class Flashcard(Base):
    """
    Syllabus-aligned flashcards for spaced repetition.
    """
    __tablename__ = "flashcards"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True)
    front_prompt = Column(Text, nullable=False)
    back_solution = Column(Text, nullable=False)
    card_type = Column(String(50), default="definition", nullable=False)  # formula, definition, concept, code
    difficulty = Column(String(20), default="medium", nullable=False)  # easy, medium, hard
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    topic = relationship("Topic")
    concept = relationship("Concept")


class UserFlashcardReview(Base):
    """
    Spaced repetition state for each student and flashcard.
    Uses Leitner/SM-2 intervals (1, 3, 7, 14, 30 days).
    """
    __tablename__ = "user_flashcard_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    flashcard_id = Column(String(36), ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_rating = Column(String(20), nullable=False)  # known, uncertain, not_understood
    next_review_due = Column(DateTime(timezone=True), nullable=False)
    interval_days = Column(Integer, default=1, nullable=False)
    review_count = Column(Integer, default=1, nullable=False)
    last_reviewed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    flashcard = relationship("Flashcard")


class CodeChallenge(Base):
    """
    Interactive coding puzzle for Code Quest game.
    Evaluated in isolated sandbox.
    """
    __tablename__ = "code_challenges"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    language = Column(String(50), default="java", nullable=False)  # java or python
    problem_statement = Column(Text, nullable=False)
    initial_code = Column(Text, nullable=False)
    test_cases_json = Column(JSON, default=list, nullable=False)
    hints_json = Column(JSON, default=list, nullable=False)
    difficulty = Column(String(20), default="medium", nullable=False)  # easy, medium, hard
    xp_reward = Column(Integer, default=60, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    topic = relationship("Topic")
