import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Class(Base):
    __tablename__ = "classes"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, nullable=False, index=True)
    description = Column(Text, nullable=True)
    teacher_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    teacher = relationship("User", back_populates="taught_classes", foreign_keys=[teacher_id])
    members = relationship("ClassMembership", back_populates="classroom", cascade="all, delete-orphan")
    assessments = relationship("Assessment", back_populates="classroom", cascade="all, delete-orphan")


class ClassMembership(Base):
    __tablename__ = "class_memberships"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="active", nullable=False)  # active, archived
    enrolled_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    classroom = relationship("Class", back_populates="members")
    student = relationship("User", back_populates="enrollments", foreign_keys=[student_id])
