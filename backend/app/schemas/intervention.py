from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class InterventionCandidateResponse(BaseModel):
    id: str
    strategy: str
    title: str
    intended_objective: str
    reason: str
    supporting_evidence: Optional[List[Any]] = None
    estimated_effort_minutes: int
    difficulty: str
    expected_benefit_score: float
    uncertainty: float
    ranking_score: float
    is_recommended: bool
    content_preview: Optional[str] = None
    intervention_id: Optional[str] = None

    # Frontend convenience aliases
    description: Optional[str] = None
    target_concept: Optional[str] = None
    rationale: Optional[str] = None
    estimated_time_minutes: Optional[int] = None
    score: Optional[float] = None
    ranking: Optional[int] = None
    evidence_strength: Optional[float] = None
    expected_benefit_label: Optional[str] = None

    class Config:
        from_attributes = True


class InterventionVersionResponse(BaseModel):
    id: str
    version_num: int
    title: str
    strategy: str
    content: Dict[str, Any]
    created_by_role: str
    author_id: Optional[str] = None
    change_notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class InterventionResponse(BaseModel):
    id: str
    student_id: str
    target_concept: str
    target_topic_id: Optional[str] = None
    target_topic_name: Optional[str] = None
    selected_strategy: str
    reason: str
    confidence: float
    expected_goal: Optional[str] = None
    status: str
    teacher_status: str
    current_version_num: int
    trigger_assessment_id: Optional[str] = None
    reassessment_id: Optional[str] = None
    created_at: datetime
    approved_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    candidates: List[InterventionCandidateResponse] = []
    current_version: Optional[InterventionVersionResponse] = None

    class Config:
        from_attributes = True


class InterventionApprovalRequest(BaseModel):
    action: str = Field(description="'approve', 'modify', 'reject', or 'request_evidence'")
    selected_candidate_id: Optional[str] = None
    modified_strategy: Optional[str] = None
    modified_title: Optional[str] = None
    modified_content: Optional[Dict[str, Any]] = None
    teacher_comments: Optional[str] = None


class InterventionOutcomeResponse(BaseModel):
    id: str
    intervention_id: str
    student_id: str
    baseline_score: float
    post_score: float
    score_difference: float
    success: bool
    objective_met: bool
    topic_mastery_before: Optional[Dict[str, Any]] = None
    topic_mastery_after: Optional[Dict[str, Any]] = None
    remaining_misconceptions: Optional[List[Any]] = None
    next_recommendation: Optional[str] = None
    measured_at: datetime

    class Config:
        from_attributes = True
