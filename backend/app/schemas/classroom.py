from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.user import UserResponse


class ClassBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None


class ClassCreate(ClassBase):
    pass


class ClassResponse(ClassBase):
    id: str
    teacher_id: str
    created_at: datetime
    teacher: Optional[UserResponse] = None
    student_count: Optional[int] = 0

    class Config:
        from_attributes = True


class MembershipCreate(BaseModel):
    student_id: str


class MembershipResponse(BaseModel):
    id: str
    class_id: str
    student_id: str
    status: str
    enrolled_at: datetime
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True
