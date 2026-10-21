import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class MasteryStatus(str):
    NOT_STARTED = "Not Started"
    DEVELOPING = "Developing"
    NEEDS_ATTENTION = "Needs Attention"
    MASTERED = "Mastered"


class MisconceptionStatus(str):
    HYPOTHESIS = "Hypothesis"
    TEACHER_CONFIRMED = "Teacher Confirmed"
    REJECTED = "Rejected"
    UNCERTAIN = "Uncertain"
    RESOLVED = "Resolved"


class LearnerState(Base):
    """
    Learner Digital Twin: Dynamic, persistent state per topic.
    Updates only from real evidence (assessments, verified teacher reviews, reassessments).
    """
    __tablename__ = "learner_states"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    mastery_score = Column(Float, default=0.0, nullable=False)  # 0.0 to 100.0 percentage
    confidence = Column(Float, default=0.5, nullable=False)  # 0.0 to 1.0 confidence in estimation
    status = Column(String(50), default=MasteryStatus.NOT_STARTED, nullable=False)
    assessment_count = Column(Integer, default=0)
    version = Column(Integer, default=1)
    evidence_references = Column(JSON, nullable=True)  # list of attempt/submission IDs contributing
    last_updated = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    student = relationship("User", back_populates="learner_states")
    topic = relationship("Topic", back_populates="learner_states")


class Misconception(Base):
    """
    Cognitive Root-Cause Misconception Graph node.
    Cannot be permanently confirmed by a single AI guess; requires teacher verification.
    """
    __tablename__ = "misconceptions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    concept = Column(String(255), nullable=False)  # e.g. "Recursion"
    root_cause = Column(String(255), nullable=False)  # e.g. "Stack-frame execution misunderstood"
    description = Column(Text, nullable=False)
    status = Column(String(50), default=MisconceptionStatus.HYPOTHESIS, nullable=False)
    confidence = Column(Float, default=0.75, nullable=False)  # 0.0 to 1.0
    evidence_summary = Column(Text, nullable=True)  # "4 out of 5 recursive call questions missed base condition"
    supporting_evidence = Column(JSON, nullable=True)  # list of question_ids, answer snippets
    detected_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    student = relationship("User", back_populates="misconceptions")
    relationships = relationship(
        "MisconceptionRelationship",
        back_populates="misconception",
        cascade="all, delete-orphan"
    )


class MisconceptionRelationship(Base):
    """
    Graph edge linking a misconception to its prerequisite gaps or concept dependencies.
    """
    __tablename__ = "misconception_relationships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    misconception_id = Column(String(36), ForeignKey("misconceptions.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    strength = Column(Float, default=0.85)  # 0.0 to 1.0 edge weight
    explanation = Column(Text, nullable=True)

    # Relationships
    misconception = relationship("Misconception", back_populates="relationships")
    prerequisite_topic = relationship("Topic")


class LearningEvent(Base):
    """
    Audit and activity log of all learning events for the student.
    """
    __tablename__ = "learning_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    event_type = Column(String(100), nullable=False)  # 'assessment_submitted', 'misconception_diagnosed', 'intervention_approved', etc.
    payload = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
