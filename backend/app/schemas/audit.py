from datetime import datetime
from typing import Optional, Dict, Any
from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: str
    actor_id: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    target_type: Optional[str] = None
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class NotificationResponse(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    notification_type: str
    link_url: Optional[str] = None
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LearningResourceResponse(BaseModel):
    id: str
    topic_id: Optional[str] = None
    concept_id: Optional[str] = None
    title: str
    resource_type: str
    content: str
    metadata_json: Optional[Dict[str, Any]] = None
    estimated_minutes: int
    difficulty: str
    is_approved: bool
    created_at: datetime

    class Config:
        from_attributes = True
