from typing import Optional, List
from pydantic import BaseModel, Field


class ConceptBase(BaseModel):
    code: str
    name: str
    description: Optional[str] = None
    difficulty_level: str = "intermediate"


class ConceptCreate(ConceptBase):
    topic_id: str


class ConceptResponse(ConceptBase):
    id: str
    topic_id: str

    class Config:
        from_attributes = True


class PrerequisiteLink(BaseModel):
    id: str
    prerequisite_topic_id: str
    prerequisite_topic_name: Optional[str] = None
    prerequisite_topic_code: Optional[str] = None
    relationship_type: str = "hard_prerequisite"
    strength: float = 1.0
    explanation: Optional[str] = None


class TopicBase(BaseModel):
    code: str
    name: str
    category: str = "Computer Science"
    description: Optional[str] = None
    order_index: int = 0


class TopicCreate(TopicBase):
    pass


class TopicResponse(TopicBase):
    id: str
    concepts: List[ConceptResponse] = []
    prerequisites: List[PrerequisiteLink] = []

    class Config:
        from_attributes = True
