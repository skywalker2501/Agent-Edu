import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class LiveClassSession(Base):
    __tablename__ = "live_class_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String(50), default="live", nullable=False)  # scheduled, live, ended
    
    # Slides / teaching notes / materials uploaded by the teacher
    materials_json = Column(JSON, nullable=True)  # [{"slide_num": 1, "title": "...", "content": "...", "code": "..."}]
    current_slide = Column(Integer, default=0, nullable=False)
    active_attendees_count = Column(Integer, default=1, nullable=False)
    
    started_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    ended_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    classroom = relationship("Class")
    teacher = relationship("User", foreign_keys=[teacher_id])
    messages = relationship("LiveClassMessage", back_populates="session", cascade="all, delete-orphan")


class LiveClassMessage(Base):
    __tablename__ = "live_class_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), ForeignKey("live_class_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user_name = Column(String(255), nullable=False)
    user_role = Column(String(50), nullable=False)
    message = Column(Text, nullable=False)
    is_question = Column(Boolean, default=False)
    is_answered = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationship
    session = relationship("LiveClassSession", back_populates="messages")
