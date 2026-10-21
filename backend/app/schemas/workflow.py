from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AIWorkflowStepResponse(BaseModel):
    id: str
    agent_name: str
    stage_name: str
    step_order: int
    input_payload: Optional[Dict[str, Any]] = None
    output_payload: Optional[Dict[str, Any]] = None
    status: str
    execution_time_ms: int
    error_details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AIWorkflowResponse(BaseModel):
    id: str
    student_id: str
    assessment_id: Optional[str] = None
    intervention_id: Optional[str] = None
    workflow_type: str
    current_stage: str
    status: str
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    steps: List[AIWorkflowStepResponse] = []

    class Config:
        from_attributes = True
