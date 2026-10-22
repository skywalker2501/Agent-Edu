import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.curriculum import Course, Chapter, Topic, Concept, LearningObjective
from app.api.deps import get_current_user

router = APIRouter(prefix="/curriculum", tags=["Syllabus & Course Management"])


# --- Schemas ---
class CourseCreate(BaseModel):
    code: str
    title: str
    description: Optional[str] = None


class ChapterCreate(BaseModel):
    course_id: str
    title: str
    description: Optional[str] = None
    order_index: int = 0


class TopicCreate(BaseModel):
    chapter_id: Optional[str] = None
    code: str
    name: str
    category: str = "Computer Science"
    description: Optional[str] = None
    order_index: int = 0


class LearningObjectiveCreate(BaseModel):
    topic_id: str
    description: str
    bloom_level: str = "understand"


async def _ensure_default_course_hierarchy(db: AsyncSession):
    """Ensures at least one complete Course -> Chapter -> Topic hierarchy exists."""
    count = (await db.execute(select(Course))).scalars().first()
    if not count:
        course = Course(
            code="CS-DSA-101",
            title="Data Structures & Algorithms Mastery",
            description="Comprehensive curriculum covering linear structures, trees, graphs, and dynamic programming."
        )
        db.add(course)
        await db.flush()

        ch1 = Chapter(course_id=course.id, title="Unit 1: Linear Data Structures", order_index=1)
        ch2 = Chapter(course_id=course.id, title="Unit 2: Recursion & Hierarchical Trees", order_index=2)
        ch3 = Chapter(course_id=course.id, title="Unit 3: Dynamic Programming & Optimization", order_index=3)
        db.add_all([ch1, ch2, ch3])
        await db.flush()

        # Link existing topics to chapters
        topics = (await db.execute(select(Topic))).scalars().all()
        for t in topics:
            if not t.chapter_id:
                if any(w in t.name.lower() for w in ["array", "list", "stack", "queue"]):
                    t.chapter_id = ch1.id
                elif any(w in t.name.lower() for w in ["recursion", "tree", "bst"]):
                    t.chapter_id = ch2.id
                else:
                    t.chapter_id = ch3.id
        await db.commit()


@router.get("/courses")
async def list_course_hierarchy(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns complete syllabus hierarchy: Courses -> Chapters -> Topics -> Learning Objectives."""
    await _ensure_default_course_hierarchy(db)

    stmt = (
        select(Course)
        .options(
            selectinload(Course.chapters).selectinload(Chapter.topics).selectinload(Topic.learning_objectives),
            selectinload(Course.chapters).selectinload(Chapter.topics).selectinload(Topic.concepts)
        )
        .order_by(Course.created_at.asc())
    )
    res = await db.execute(stmt)
    courses = res.scalars().all()

    output = []
    for c in courses:
        output.append({
            "id": c.id,
            "code": c.code,
            "title": c.title,
            "description": c.description,
            "chapters": [
                {
                    "id": ch.id,
                    "title": ch.title,
                    "order_index": ch.order_index,
                    "topics": [
                        {
                            "id": t.id,
                            "code": t.code,
                            "name": t.name,
                            "category": t.category,
                            "description": t.description,
                            "learning_objectives": [
                                {"id": lo.id, "description": lo.description, "bloom_level": lo.bloom_level}
                                for lo in t.learning_objectives
                            ],
                            "concepts": [
                                {"id": co.id, "code": co.code, "name": co.name, "difficulty": co.difficulty_level}
                                for co in t.concepts
                            ]
                        }
                        for t in ch.topics
                    ]
                }
                for ch in c.chapters
            ]
        })
    return output


@router.post("/courses", status_code=status.HTTP_201_CREATED)
async def create_course(
    payload: CourseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a new syllabus course (Teacher or Admin only)."""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers or administrators can author courses")

    course = Course(code=payload.code, title=payload.title, description=payload.description)
    db.add(course)
    await db.commit()
    await db.refresh(course)
    return {"id": course.id, "code": course.code, "title": course.title}


@router.post("/chapters", status_code=status.HTTP_201_CREATED)
async def create_chapter(
    payload: ChapterCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a syllabus chapter (Teacher or Admin only)."""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers or administrators can author chapters")

    chapter = Chapter(
        course_id=payload.course_id,
        title=payload.title,
        description=payload.description,
        order_index=payload.order_index
    )
    db.add(chapter)
    await db.commit()
    await db.refresh(chapter)
    return {"id": chapter.id, "title": chapter.title, "order_index": chapter.order_index}


@router.post("/learning-objectives", status_code=status.HTTP_201_CREATED)
async def create_learning_objective(
    payload: LearningObjectiveCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Creates a verifiable learning objective for a topic (Teacher or Admin only)."""
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only teachers or administrators can author learning objectives")

    lo = LearningObjective(
        topic_id=payload.topic_id,
        description=payload.description,
        bloom_level=payload.bloom_level
    )
    db.add(lo)
    await db.commit()
    await db.refresh(lo)
    return {"id": lo.id, "description": lo.description, "bloom_level": lo.bloom_level}
