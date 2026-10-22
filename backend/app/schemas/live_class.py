from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class SlideItem(BaseModel):
    slide_num: int
    title: str
    content: str
    code_snippet: Optional[str] = None
    notes: Optional[str] = None


class LiveClassStartRequest(BaseModel):
    class_id: str
    title: str
    description: Optional[str] = None
    slides: Optional[List[SlideItem]] = None


class SlideSyncRequest(BaseModel):
    current_slide: int


class LiveChatMessageRequest(BaseModel):
    message: str
    is_question: bool = False


class LiveChatMessageResponse(BaseModel):
    id: str
    session_id: str
    user_id: str
    user_name: str
    user_role: str
    message: str
    is_question: bool
    is_answered: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LiveClassSessionResponse(BaseModel):
    id: str
    class_id: str
    teacher_id: str
    teacher_name: Optional[str] = "Prof. Alan Turing"
    class_name: Optional[str] = "CS102: Data Structures & Algorithms"
    title: str
    description: Optional[str] = None
    status: str
    materials_json: Optional[List[Dict[str, Any]]] = None
    current_slide: int
    active_attendees_count: int
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True
