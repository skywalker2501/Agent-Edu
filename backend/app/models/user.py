import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base


class UserRole(str):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default=UserRole.STUDENT, index=True)
    avatar_url = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    taught_classes = relationship("Class", back_populates="teacher", cascade="all, delete-orphan", foreign_keys="Class.teacher_id")
    enrollments = relationship("ClassMembership", back_populates="student", cascade="all, delete-orphan", foreign_keys="ClassMembership.student_id")
    assessment_attempts = relationship("AssessmentAttempt", back_populates="student", cascade="all, delete-orphan")
    learner_states = relationship("LearnerState", back_populates="student", cascade="all, delete-orphan")
    misconceptions = relationship("Misconception", back_populates="student", cascade="all, delete-orphan")
    interventions = relationship("Intervention", back_populates="student", cascade="all, delete-orphan")
    teacher_reviews = relationship("TeacherReview", back_populates="teacher", foreign_keys="TeacherReview.teacher_id")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
