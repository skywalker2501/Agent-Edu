from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class TutorMessageRequest(BaseModel):
    content: str
    mode: Optional[str] = Field(default="explain", description="explain, hint, worked_example, guide_step_by_step, test_understanding")
    topic_id: Optional[str] = None


class TutorMessageResponse(BaseModel):
    id: str
    sender: str
    content: str
    hints: Optional[List[str]] = None
    code_snippet: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TutorConversationResponse(BaseModel):
    id: str
    student_id: str
    topic_id: Optional[str] = None
    mode: str
    title: str
    messages: List[TutorMessageResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TutorChatRequest(BaseModel):
    content: Optional[str] = None
    message: Optional[str] = None
    mode: Optional[str] = Field(default="guide_step_by_step")
    topic: Optional[str] = Field(default="Recursion")
    conversation_id: Optional[str] = None

    def get_text(self) -> str:
        return (self.content or self.message or "").strip()


class TutorChatResponse(BaseModel):
    response: str
    message: str
    content: Optional[str] = None
    hints: Optional[List[str]] = None
    code_snippet: Optional[str] = None
    suggested_followups: Optional[List[str]] = None
    conversation_id: Optional[str] = None
    mode: str
    topic: str

