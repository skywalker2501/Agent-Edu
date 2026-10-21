import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class WorkflowStatus(str):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    AWAITING_TEACHER = "awaiting_teacher"
    COMPLETED = "completed"
    FAILED = "failed"


class WorkflowStage(str):
    OBSERVE = "OBSERVE"
    DIAGNOSE = "DIAGNOSE"
    MODEL = "MODEL"
    SIMULATE = "SIMULATE"
    GOVERN = "GOVERN"
    INTERVENE = "INTERVENE"
    MEASURE = "MEASURE"
    LEARN = "LEARN"
    RE_PLAN = "RE_PLAN"


class AIWorkflow(Base):
    """
    Explicit orchestrator state machine record coordinating the 6 Logical Agents.
    """
    __tablename__ = "ai_workflows"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="SET NULL"), nullable=True)
    intervention_id = Column(String(36), ForeignKey("interventions.id", ondelete="SET NULL"), nullable=True)
    workflow_type = Column(String(100), default="closed_loop_remediation", nullable=False)
    current_stage = Column(String(50), default=WorkflowStage.OBSERVE, nullable=False)
    status = Column(String(50), default=WorkflowStatus.PENDING, nullable=False)
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    steps = relationship("AIWorkflowStep", back_populates="workflow", cascade="all, delete-orphan", order_by="AIWorkflowStep.step_order")


class AIWorkflowStep(Base):
    """
    Detailed trace of each agent execution in the workflow pipeline.
    """
    __tablename__ = "ai_workflow_steps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    workflow_id = Column(String(36), ForeignKey("ai_workflows.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name = Column(String(100), nullable=False)  # 'Learning Observer', 'Cognitive Diagnostic Agent', etc.
    stage_name = Column(String(50), nullable=False)
    step_order = Column(Integer, default=0)
    input_payload = Column(JSON, nullable=True)
    output_payload = Column(JSON, nullable=True)
    status = Column(String(50), default="completed", nullable=False)
    execution_time_ms = Column(Integer, default=0)
    error_details = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    workflow = relationship("AIWorkflow", back_populates="steps")


class TutorMode(str):
    EXPLAIN = "explain"
    HINT = "hint"
    WORKED_EXAMPLE = "worked_example"
    GUIDE_STEP_BY_STEP = "guide_step_by_step"
    TEST_UNDERSTANDING = "test_understanding"


class TutorConversation(Base):
    """
    Conversational state for Socratic AI tutoring.
    """
    __tablename__ = "tutor_conversations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    mode = Column(String(50), default=TutorMode.EXPLAIN, nullable=False)
    title = Column(String(255), default="Socratic Tutoring Session", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    messages = relationship("TutorMessage", back_populates="conversation", cascade="all, delete-orphan", order_by="TutorMessage.created_at")


class TutorMessage(Base):
    __tablename__ = "tutor_messages"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String(36), ForeignKey("tutor_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(50), nullable=False)  # 'student', 'tutor', 'system'
    content = Column(Text, nullable=False)
    hints = Column(JSON, nullable=True)  # List of progressive hint strings
    code_snippet = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    conversation = relationship("TutorConversation", back_populates="messages")
