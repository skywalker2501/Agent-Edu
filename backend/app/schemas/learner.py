from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LearnerStateResponse(BaseModel):
    id: str
    student_id: str
    topic_id: str
    topic_name: Optional[str] = None
    topic_code: Optional[str] = None
    mastery_score: float  # 0.0 to 100.0
    confidence: float    # 0.0 to 1.0
    status: str          # Not Started, Developing, Needs Attention, Mastered
    assessment_count: int
    version: int
    last_updated: datetime

    class Config:
        from_attributes = True


class MisconceptionRelationshipView(BaseModel):
    id: str
    prerequisite_topic_id: str
    prerequisite_topic_name: Optional[str] = None
    strength: float
    explanation: Optional[str] = None


class MisconceptionResponse(BaseModel):
    id: str
    student_id: str
    topic_id: str
    topic_name: Optional[str] = None
    title: Optional[str] = None
    concept: str
    root_cause: str
    description: str
    status: str  # Hypothesis, Teacher Confirmed, Rejected, Uncertain, Resolved
    confidence: float
    evidence_summary: Optional[str] = None
    supporting_evidence: Optional[List[Any]] = None
    detected_at: datetime
    resolved_at: Optional[datetime] = None
    relationships: List[MisconceptionRelationshipView] = []

    class Config:
        from_attributes = True


class MisconceptionStatusUpdate(BaseModel):
    status: str = Field(description="Teacher Confirmed, Rejected, Uncertain, or Resolved")
    teacher_notes: Optional[str] = None


class DigitalTwinSummary(BaseModel):
    student_id: str
    student_name: str
    overall_progress: float
    topics_mastered: int
    topics_needing_attention: int
    active_misconceptions_count: int
    learner_states: List[LearnerStateResponse]
    misconceptions: List[MisconceptionResponse]
    recent_events: List[Dict[str, Any]] = []
