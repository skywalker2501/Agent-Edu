import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Topic(Base):
    __tablename__ = "topics"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    code = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, default="Computer Science")
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)

    # Relationships
    concepts = relationship("Concept", back_populates="topic", cascade="all, delete-orphan")
    prerequisites = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.topic_id",
        back_populates="topic",
        cascade="all, delete-orphan"
    )
    prerequisite_for = relationship(
        "TopicPrerequisite",
        foreign_keys="TopicPrerequisite.prerequisite_topic_id",
        back_populates="prerequisite_topic",
        cascade="all, delete-orphan"
    )
    questions = relationship("Question", back_populates="topic")
    learner_states = relationship("LearnerState", back_populates="topic")


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    code = Column(String(100), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    difficulty_level = Column(String(50), default="intermediate")  # beginner, intermediate, advanced

    # Relationships
    topic = relationship("Topic", back_populates="concepts")
    questions = relationship("Question", back_populates="concept")


class TopicPrerequisite(Base):
    __tablename__ = "topic_prerequisites"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    prerequisite_topic_id = Column(String(36), ForeignKey("topics.id", ondelete="CASCADE"), nullable=False, index=True)
    relationship_type = Column(String(50), default="hard_prerequisite")  # hard_prerequisite, soft_recommendation
    strength = Column(Float, default=1.0)  # 0.0 - 1.0 importance
    explanation = Column(Text, nullable=True)

    # Relationships
    topic = relationship("Topic", foreign_keys=[topic_id], back_populates="prerequisites")
    prerequisite_topic = relationship("Topic", foreign_keys=[prerequisite_topic_id], back_populates="prerequisite_for")
