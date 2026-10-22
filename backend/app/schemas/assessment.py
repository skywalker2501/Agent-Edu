from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class QuestionBase(BaseModel):
    title: str
    prompt: str
    question_type: str = "multiple_choice"
    topic_id: Optional[str] = None
    concept_id: Optional[str] = None
    options: Optional[List[Dict[str, Any]]] = None  # [{"id": "A", "text": "..."}]
    difficulty: str = "intermediate"
    constraints: Optional[Dict[str, Any]] = None


class QuestionCreate(QuestionBase):
    reference_answer: Optional[str] = None
    rubric: Optional[Dict[str, Any]] = None
    test_cases: Optional[List[Dict[str, Any]]] = None


class QuestionStudentView(QuestionBase):
    id: str
    # Note: reference_answer, test cases with hidden solutions are omitted for students!
    class Config:
        from_attributes = True


class QuestionTeacherView(QuestionBase):
    id: str
    reference_answer: Optional[str] = None
    rubric: Optional[Dict[str, Any]] = None
    test_cases: Optional[List[Dict[str, Any]]] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AssessmentQuestionCreate(BaseModel):
    question_id: str
    points: float = 10.0
    order_index: int = 0


class AssessmentBase(BaseModel):
    title: str
    description: Optional[str] = None
    class_id: Optional[str] = None
    topic_id: Optional[str] = None
    assessment_type: str = "initial"  # initial, quiz, reassessment
    linked_intervention_id: Optional[str] = None
    time_limit_minutes: int = 30
    passing_score: float = 60.0
    is_active: bool = True


class AssessmentCreate(AssessmentBase):
    question_links: Optional[List[AssessmentQuestionCreate]] = None


class InlineQuestionCreate(BaseModel):
    title: str
    prompt: str
    options: List[Dict[str, Any]]
    correct_answer: str
    points: float = 10.0
    explanation: Optional[str] = None
    difficulty: str = "intermediate"


class TeacherCustomAssessmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    class_id: str
    topic_id: Optional[str] = None
    assessment_type: str = "quiz"
    time_limit_minutes: int = 30
    passing_score: float = 60.0
    questions: List[InlineQuestionCreate]



class AssessmentStudentView(AssessmentBase):
    id: str
    created_at: datetime
    questions: List[QuestionStudentView] = []

    class Config:
        from_attributes = True


class AssessmentTeacherView(AssessmentBase):
    id: str
    created_at: datetime
    questions: List[QuestionTeacherView] = []
    attempt_count: Optional[int] = 0

    class Config:
        from_attributes = True


class SubmitAnswerItem(BaseModel):
    question_id: str
    student_answer: str
    code_language: Optional[str] = None


class AssessmentSubmissionRequest(BaseModel):
    attempt_id: Optional[str] = None
    assessment_id: str
    answers: List[SubmitAnswerItem]
    idempotency_key: Optional[str] = None


class SubmissionAnswerResponse(BaseModel):
    id: str
    question_id: str
    student_answer: str
    code_language: Optional[str] = None
    is_correct: Optional[bool] = None
    score_awarded: float = 0.0
    max_score: float = 10.0
    automated_feedback: Optional[str] = None
    execution_results: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True


class GradingResultResponse(BaseModel):
    id: str
    total_score: float
    max_score: float
    percentage: float
    passed: bool
    topic_breakdown: Optional[Dict[str, Any]] = None
    graded_at: datetime

    class Config:
        from_attributes = True


class AssessmentResultResponse(BaseModel):
    submission_id: str
    attempt_id: str
    assessment_id: str
    student_id: str
    status: str
    submitted_at: datetime
    grading: GradingResultResponse
    answers: List[SubmissionAnswerResponse]
    next_action_recommendation: Optional[str] = None
