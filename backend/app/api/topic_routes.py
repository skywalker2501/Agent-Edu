from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError
from app.models.curriculum import Topic, Concept, TopicPrerequisite
from app.schemas.curriculum import TopicResponse, TopicCreate, ConceptResponse, ConceptCreate
from app.api.deps import get_current_user, require_admin

router = APIRouter(prefix="/topics", tags=["Curriculum & Topics"])


@router.get("", response_model=List[TopicResponse])
async def list_topics(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stmt = (
        select(Topic)
        .options(
            selectinload(Topic.concepts),
            selectinload(Topic.prerequisites).selectinload(TopicPrerequisite.prerequisite_topic)
        )
        .order_by(Topic.order_index)
    )
    res = await db.execute(stmt)
    topics = res.scalars().all()

    # Format response
    output = []
    for t in topics:
        prereq_links = []
        for p in t.prerequisites:
            prereq_links.append({
                "id": p.id,
                "prerequisite_topic_id": p.prerequisite_topic_id,
                "prerequisite_topic_name": p.prerequisite_topic.name if p.prerequisite_topic else None,
                "prerequisite_topic_code": p.prerequisite_topic.code if p.prerequisite_topic else None,
                "relationship_type": p.relationship_type,
                "strength": p.strength,
                "explanation": p.explanation
            })

        output.append(
            TopicResponse(
                id=t.id,
                code=t.code,
                name=t.name,
                category=t.category,
                description=t.description,
                order_index=t.order_index,
                concepts=[ConceptResponse.model_validate(c) for c in t.concepts],
                prerequisites=prereq_links
            )
        )
    return output


@router.get("/{topic_id}", response_model=TopicResponse)
async def get_topic(
    topic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    stmt = (
        select(Topic)
        .where(Topic.id == topic_id)
        .options(
            selectinload(Topic.concepts),
            selectinload(Topic.prerequisites).selectinload(TopicPrerequisite.prerequisite_topic)
        )
    )
    res = await db.execute(stmt)
    t = res.scalar_one_or_none()
    if not t:
        raise ResourceNotFoundError("Topic", topic_id)

    prereq_links = [
        {
            "id": p.id,
            "prerequisite_topic_id": p.prerequisite_topic_id,
            "prerequisite_topic_name": p.prerequisite_topic.name if p.prerequisite_topic else None,
            "prerequisite_topic_code": p.prerequisite_topic.code if p.prerequisite_topic else None,
            "relationship_type": p.relationship_type,
            "strength": p.strength,
            "explanation": p.explanation
        }
        for p in t.prerequisites
    ]

    return TopicResponse(
        id=t.id,
        code=t.code,
        name=t.name,
        category=t.category,
        description=t.description,
        order_index=t.order_index,
        concepts=[ConceptResponse.model_validate(c) for c in t.concepts],
        prerequisites=prereq_links
    )
