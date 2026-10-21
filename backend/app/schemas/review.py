from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class TeacherReviewResponse(BaseModel):
    id: str
    submission_id: str
    teacher_id: Optional[str] = None
    teacher_name: Optional[str] = None
    status: str
    method_review_outcome: str
    ai_evaluation: Optional[Dict[str, Any]] = None
    ai_suggested_marks: Optional[float] = None
    teacher_comments: Optional[str] = None
    marks_awarded: Optional[float] = None
    is_alternative_accepted: bool = False
    alternative_approach_name: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class MethodReviewDecisionRequest(BaseModel):
    method_review_outcome: str = Field(
        description="One of the 8 explicit outcomes from CEP tr.pdf"
    )
    teacher_comments: str
    marks_awarded: float
    is_alternative_accepted: bool = False
    alternative_approach_name: Optional[str] = None


class TeacherDecisionResponse(BaseModel):
    id: str
    teacher_id: str
    teacher_name: Optional[str] = None
    entity_type: str
    entity_id: str
    decision_type: str
    original_state: Optional[Dict[str, Any]] = None
    new_state: Dict[str, Any]
    justification: str
    created_at: datetime

    class Config:
        from_attributes = True


class SolutionApproachOption(BaseModel):
    approach_name: str  # e.g. "Two-pointer Technique", "StringBuilder Reversal", "Recursive Reversal"
    method_category: str  # "In-place Iterative", "Standard Library", "Recursive Divide & Conquer"
    time_complexity: str  # "O(n)"
    space_complexity: str  # "O(1)", "O(n)"
    code_example: str
    main_advantage: str
    tradeoffs_and_risks: str
    correctness_status: str  # "Verified by Automated Tests", "Valid Alternative", "Unverified"
    educational_suitability: str
    matches_student_submission: bool = False


class MultiApproachSuggestionResponse(BaseModel):
    question_id: str
    question_title: str
    question_prompt: str
    student_submission_snippet: Optional[str] = None
    approaches: List[SolutionApproachOption]
    ai_recommendation_reason: str
