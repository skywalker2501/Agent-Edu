import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class AuditEvent(Base):
    """
    Immutable audit logging for security, administrative actions, and academic decisions.
    """
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    actor_id = Column(String(36), nullable=True, index=True)
    actor_role = Column(String(50), nullable=True)
    action = Column(String(100), nullable=False)  # 'user_login', 'grade_override', 'intervention_approved', etc.
    target_type = Column(String(100), nullable=True)  # 'submission', 'user', 'intervention'
    target_id = Column(String(36), nullable=True, index=True)
    details = Column(JSON, nullable=True)
    ip_address = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)


class Notification(Base):
    """
    In-app alerts and notifications for students and teachers.
    """
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="info", nullable=False)  # 'intervention_pending', 'intervention_approved', 'reassessment_ready', 'review_required'
    link_url = Column(String(500), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    user = relationship("User", back_populates="notifications")


class LearningResource(Base):
    """
    Approved repository of educational assets (worked examples, prerequisite primers,
    stack frame visualizations, etc.)
    """
    __tablename__ = "learning_resources"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    resource_type = Column(String(50), nullable=False)  # 'lesson', 'worked_example', 'visualization', 'practice'
    content = Column(Text, nullable=False)  # Markdown or interactive payload
    metadata_json = Column(JSON, nullable=True)
    estimated_minutes = Column(Integer, default=15)
    difficulty = Column(String(50), default="intermediate")
    is_approved = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
