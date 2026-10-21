import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class MethodReviewOutcome(str):
    CORRECT_METHOD_AND_ANSWER = "Correct method and answer"
    CORRECT_ALTERNATIVE_METHOD = "Correct alternative method"
    CORRECT_ANSWER_INCOMPLETE_REASONING = "Correct answer with incomplete reasoning"
    PARTIALLY_CORRECT_SOLUTION = "Partially correct solution"
    INCORRECT_ANSWER_VALID_REASONING = "Incorrect answer with valid intermediate reasoning"
    INCORRECT_METHOD_AND_ANSWER = "Incorrect method and answer"
    INSUFFICIENT_EVIDENCE = "Insufficient evidence"
    REQUIRES_MANUAL_REVIEW = "Requires manual review"


class TeacherReview(Base):
    """
    Teacher review workspace record for evaluating student submissions,
    methods, and alternative valid solutions.
    """
    __tablename__ = "teacher_reviews"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id", ondelete="CASCADE"), unique=True, nullable=False)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(String(50), default="pending", nullable=False)  # pending, completed
    
    # 8 explicit outcomes from CEP tr.pdf
    method_review_outcome = Column(String(100), default=MethodReviewOutcome.REQUIRES_MANUAL_REVIEW, nullable=False)
    
    # AI preliminary assessment
    ai_evaluation = Column(JSON, nullable=True)  # {"reasoning": "...", "confidence": 0.88, "detected_method": "..."}
    ai_suggested_marks = Column(Float, nullable=True)
    
    # Teacher judgment & overrides
    teacher_comments = Column(Text, nullable=True)
    marks_awarded = Column(Float, nullable=True)
    is_alternative_accepted = Column(Boolean, default=False)
    alternative_approach_name = Column(String(100), nullable=True)  # e.g. "Recursive In-Place String Reversal"
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    submission = relationship("Submission", back_populates="teacher_review")
    teacher = relationship("User", back_populates="teacher_reviews", foreign_keys=[teacher_id])


class TeacherDecision(Base):
    """
    Traceable, immutable record of every consequential teacher action.
    """
    __tablename__ = "teacher_decisions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False)  # 'submission', 'misconception', 'intervention'
    entity_id = Column(String(36), nullable=False, index=True)
    decision_type = Column(String(50), nullable=False)  # 'accept', 'override', 'confirm_misconception', 'approve_intervention', etc.
    original_state = Column(JSON, nullable=True)
    new_state = Column(JSON, nullable=False)
    justification = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
