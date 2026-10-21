import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Text, Integer, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base


class QuestionType(str):
    MULTIPLE_CHOICE = "multiple_choice"
    MULTIPLE_SELECT = "multiple_select"
    SHORT_ANSWER = "short_answer"
    PROGRAMMING = "programming"


class Question(Base):
    __tablename__ = "questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    concept_id = Column(String(36), ForeignKey("concepts.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    prompt = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False, default=QuestionType.MULTIPLE_CHOICE)
    
    # JSON content: options for MCQs [{"id": "A", "text": "..."}, ...], correct_answer_key(s)
    options = Column(JSON, nullable=True)
    reference_answer = Column(Text, nullable=True)  # canonical or reference answer
    rubric = Column(JSON, nullable=True)  # evaluation criteria
    constraints = Column(JSON, nullable=True)  # time complexity, memory, language requirements
    test_cases = Column(JSON, nullable=True)  # [{"input": "...", "expected_output": "...", "is_hidden": false}]
    difficulty = Column(String(50), default="intermediate")  # beginner, intermediate, advanced
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    topic = relationship("Topic", back_populates="questions")
    concept = relationship("Concept", back_populates="questions")
    versions = relationship("QuestionVersion", back_populates="question", cascade="all, delete-orphan")
    assessment_links = relationship("AssessmentQuestion", back_populates="question")
    answers = relationship("SubmissionAnswer", back_populates="question")


class QuestionVersion(Base):
    __tablename__ = "question_versions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    version_num = Column(Integer, nullable=False, default=1)
    prompt = Column(Text, nullable=False)
    options = Column(JSON, nullable=True)
    reference_answer = Column(Text, nullable=True)
    test_cases = Column(JSON, nullable=True)
    changed_by = Column(String(36), nullable=True)
    changed_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    question = relationship("Question", back_populates="versions")


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    class_id = Column(String(36), ForeignKey("classes.id", ondelete="SET NULL"), nullable=True, index=True)
    topic_id = Column(String(36), ForeignKey("topics.id", ondelete="SET NULL"), nullable=True, index=True)
    assessment_type = Column(String(50), default="initial", nullable=False)  # initial, quiz, reassessment
    linked_intervention_id = Column(String(36), nullable=True)  # if this is a reassessment linked to an intervention
    time_limit_minutes = Column(Integer, default=30)
    passing_score = Column(Float, default=60.0)  # percentage
    is_active = Column(Boolean, default=True)
    created_by = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    classroom = relationship("Class", back_populates="assessments")
    questions = relationship("AssessmentQuestion", back_populates="assessment", cascade="all, delete-orphan", order_by="AssessmentQuestion.order_index")
    attempts = relationship("AssessmentAttempt", back_populates="assessment", cascade="all, delete-orphan")


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    points = Column(Float, default=10.0)
    order_index = Column(Integer, default=0)

    # Relationships
    assessment = relationship("Assessment", back_populates="questions")
    question = relationship("Question", back_populates="assessment_links")


class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="in_progress")  # in_progress, submitted, graded
    start_time = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    submit_time = Column(DateTime(timezone=True), nullable=True)
    score = Column(Float, default=0.0)
    max_score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    passed = Column(Boolean, default=False)
    idempotency_key = Column(String(100), unique=True, nullable=True, index=True)

    # Relationships
    assessment = relationship("Assessment", back_populates="attempts")
    student = relationship("User", back_populates="assessment_attempts")
    submission = relationship("Submission", back_populates="attempt", uselist=False, cascade="all, delete-orphan")


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String(36), ForeignKey("assessment_attempts.id", ondelete="CASCADE"), unique=True, nullable=False)
    student_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assessment_id = Column(String(36), ForeignKey("assessments.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(String(50), default="submitted")  # submitted, analyzed, reviewed
    submitted_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    attempt = relationship("AssessmentAttempt", back_populates="submission")
    answers = relationship("SubmissionAnswer", back_populates="submission", cascade="all, delete-orphan")
    grading_result = relationship("GradingResult", back_populates="submission", uselist=False, cascade="all, delete-orphan")
    teacher_review = relationship("TeacherReview", back_populates="submission", uselist=False)


class SubmissionAnswer(Base):
    __tablename__ = "submission_answers"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False, index=True)
    question_id = Column(String(36), ForeignKey("questions.id", ondelete="CASCADE"), nullable=False, index=True)
    student_answer = Column(Text, nullable=False)  # selected option, text answer, or code
    code_language = Column(String(50), nullable=True)  # 'java', 'python', 'javascript'
    is_correct = Column(Boolean, default=False)
    score_awarded = Column(Float, default=0.0)
    max_score = Column(Float, default=10.0)
    automated_feedback = Column(Text, nullable=True)
    execution_results = Column(JSON, nullable=True)  # test cases passed/failed, stderr, execution_time

    # Relationships
    submission = relationship("Submission", back_populates="answers")
    question = relationship("Question", back_populates="answers")


class GradingResult(Base):
    __tablename__ = "grading_results"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    submission_id = Column(String(36), ForeignKey("submissions.id", ondelete="CASCADE"), unique=True, nullable=False)
    total_score = Column(Float, nullable=False)
    max_score = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    passed = Column(Boolean, default=False)
    topic_breakdown = Column(JSON, nullable=True)  # {"recursion": {"score": 4.0, "max": 10.0, "percentage": 40.0}}
    graded_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    submission = relationship("Submission", back_populates="grading_result")
