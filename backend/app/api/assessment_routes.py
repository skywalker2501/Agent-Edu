from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.assessment import Assessment, Question, AssessmentQuestion, AssessmentAttempt
from app.models.user import User, UserRole
from app.schemas.assessment import (
    AssessmentBase, AssessmentCreate, AssessmentStudentView, AssessmentTeacherView,
    QuestionStudentView, QuestionTeacherView, TeacherCustomAssessmentCreate
)
from app.api.deps import get_current_user, require_teacher

router = APIRouter(prefix="/assessments", tags=["Assessments & Quizzes"])


@router.get("", response_model=List[AssessmentStudentView])
async def list_assessments(
    class_id: Optional[str] = None,
    assessment_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.question)
        )
        .where(Assessment.is_active == True)
    )
    if class_id:
        stmt = stmt.where(Assessment.class_id == class_id)
    if assessment_type:
        stmt = stmt.where(Assessment.assessment_type == assessment_type)

    res = await db.execute(stmt)
    assessments = res.scalars().all()

    output = []
    for a in assessments:
        q_views = []
        for aq in a.questions:
            q = aq.question
            if q:
                q_views.append(QuestionStudentView(
                    id=q.id,
                    title=q.title,
                    prompt=q.prompt,
                    question_type=q.question_type,
                    topic_id=q.topic_id,
                    concept_id=q.concept_id,
                    options=q.options,
                    difficulty=q.difficulty,
                    constraints=q.constraints
                ))

        output.append(AssessmentStudentView(
            id=a.id,
            title=a.title,
            description=a.description,
            class_id=a.class_id,
            topic_id=a.topic_id,
            assessment_type=a.assessment_type,
            linked_intervention_id=a.linked_intervention_id,
            time_limit_minutes=a.time_limit_minutes,
            passing_score=a.passing_score,
            is_active=a.is_active,
            created_at=a.created_at,
            questions=q_views
        ))
    return output


@router.get("/{assessment_id}", response_model=AssessmentStudentView)
async def get_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(Assessment)
        .where(Assessment.id == assessment_id)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.question)
        )
    )
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise ResourceNotFoundError("Assessment", assessment_id)

    # Convert questions to student view (prevent answer leaks!)
    q_views = []
    for aq in a.questions:
        q = aq.question
        if q:
            q_views.append(QuestionStudentView(
                id=q.id,
                title=q.title,
                prompt=q.prompt,
                question_type=q.question_type,
                topic_id=q.topic_id,
                concept_id=q.concept_id,
                options=q.options,
                difficulty=q.difficulty,
                constraints=q.constraints
            ))

    return AssessmentStudentView(
        id=a.id,
        title=a.title,
        description=a.description,
        class_id=a.class_id,
        topic_id=a.topic_id,
        assessment_type=a.assessment_type,
        linked_intervention_id=a.linked_intervention_id,
        time_limit_minutes=a.time_limit_minutes,
        passing_score=a.passing_score,
        is_active=a.is_active,
        created_at=a.created_at,
        questions=q_views
    )


@router.post("", response_model=AssessmentTeacherView, status_code=status.HTTP_201_CREATED)
async def create_assessment(
    payload: AssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    new_assessment = Assessment(
        title=payload.title,
        description=payload.description,
        class_id=payload.class_id,
        topic_id=payload.topic_id,
        assessment_type=payload.assessment_type,
        linked_intervention_id=payload.linked_intervention_id,
        time_limit_minutes=payload.time_limit_minutes,
        passing_score=payload.passing_score,
        is_active=payload.is_active,
        created_by=current_user.id
    )
    db.add(new_assessment)
    await db.flush()

    if payload.question_links:
        for idx, qlink in enumerate(payload.question_links):
            aq = AssessmentQuestion(
                assessment_id=new_assessment.id,
                question_id=qlink.question_id,
                points=qlink.points,
                order_index=qlink.order_index or idx
            )
            db.add(aq)

    await db.commit()
    await db.refresh(new_assessment)
    return AssessmentTeacherView(
        id=new_assessment.id,
        title=new_assessment.title,
        description=new_assessment.description,
        class_id=new_assessment.class_id,
        topic_id=new_assessment.topic_id,
        assessment_type=new_assessment.assessment_type,
        linked_intervention_id=new_assessment.linked_intervention_id,
        time_limit_minutes=new_assessment.time_limit_minutes,
        passing_score=new_assessment.passing_score,
        is_active=new_assessment.is_active,
        created_at=new_assessment.created_at,
        questions=[]
    )


@router.post("/custom", response_model=AssessmentTeacherView, status_code=status.HTTP_201_CREATED)
async def create_custom_assessment(
    payload: TeacherCustomAssessmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teachers to author and assign assessments with custom inline questions."""
    new_assessment = Assessment(
        title=payload.title,
        description=payload.description or "Custom assessment assigned by your instructor.",
        class_id=payload.class_id,
        topic_id=payload.topic_id,
        assessment_type=payload.assessment_type,
        time_limit_minutes=payload.time_limit_minutes,
        passing_score=payload.passing_score,
        is_active=True,
        created_by=current_user.id
    )
    db.add(new_assessment)
    await db.flush()

    q_views = []
    for idx, q_data in enumerate(payload.questions):
        q = Question(
            title=q_data.title,
            prompt=q_data.prompt,
            question_type="multiple_choice",
            options=q_data.options,
            reference_answer=q_data.correct_answer,
            rubric={"explanation": q_data.explanation} if q_data.explanation else None,
            difficulty=q_data.difficulty or "intermediate",
            created_by=current_user.id
        )
        db.add(q)
        await db.flush()

        aq = AssessmentQuestion(
            assessment_id=new_assessment.id,
            question_id=q.id,
            points=q_data.points or 10.0,
            order_index=idx
        )
        db.add(aq)

        q_views.append(QuestionTeacherView(
            id=q.id,
            title=q.title,
            prompt=q.prompt,
            question_type=q.question_type,
            options=q.options,
            reference_answer=q.reference_answer,
            rubric=q.rubric,
            difficulty=q.difficulty,
            created_at=q.created_at
        ))

    await db.commit()
    await db.refresh(new_assessment)

    return AssessmentTeacherView(
        id=new_assessment.id,
        title=new_assessment.title,
        description=new_assessment.description,
        class_id=new_assessment.class_id,
        topic_id=new_assessment.topic_id,
        assessment_type=new_assessment.assessment_type,
        linked_intervention_id=new_assessment.linked_intervention_id,
        time_limit_minutes=new_assessment.time_limit_minutes,
        passing_score=new_assessment.passing_score,
        is_active=new_assessment.is_active,
        created_at=new_assessment.created_at,
        questions=q_views,
        attempt_count=0
    )


@router.get("/teacher/all", response_model=List[AssessmentTeacherView])
async def list_teacher_assessments(
    class_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Returns all assessments created by or assigned to the teacher's classes."""
    stmt = (
        select(Assessment)
        .options(
            selectinload(Assessment.questions).selectinload(AssessmentQuestion.question)
        )
        .order_by(Assessment.created_at.desc())
    )
    if class_id:
        stmt = stmt.where(Assessment.class_id == class_id)

    res = await db.execute(stmt)
    assessments = res.scalars().all()

    output = []
    for a in assessments:
        q_views = []
        for aq in a.questions:
            q = aq.question
            if q:
                q_views.append(QuestionTeacherView(
                    id=q.id,
                    title=q.title,
                    prompt=q.prompt,
                    question_type=q.question_type,
                    topic_id=q.topic_id,
                    concept_id=q.concept_id,
                    options=q.options,
                    reference_answer=q.reference_answer,
                    rubric=q.rubric,
                    difficulty=q.difficulty,
                    constraints=q.constraints,
                    created_at=q.created_at
                ))

        # Count attempts
        cnt_stmt = select(func.count(AssessmentAttempt.id)).where(AssessmentAttempt.assessment_id == a.id)
        cnt_res = await db.execute(cnt_stmt)
        attempts = cnt_res.scalar() or 0

        output.append(AssessmentTeacherView(
            id=a.id,
            title=a.title,
            description=a.description,
            class_id=a.class_id,
            topic_id=a.topic_id,
            assessment_type=a.assessment_type,
            linked_intervention_id=a.linked_intervention_id,
            time_limit_minutes=a.time_limit_minutes,
            passing_score=a.passing_score,
            is_active=a.is_active,
            created_at=a.created_at,
            questions=q_views,
            attempt_count=attempts
        ))
    return output


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assessment(
    assessment_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Deletes or deactivates an assessment."""
    stmt = select(Assessment).where(Assessment.id == assessment_id)
    res = await db.execute(stmt)
    a = res.scalar_one_or_none()
    if not a:
        raise ResourceNotFoundError("Assessment", assessment_id)

    await db.delete(a)
    await db.commit()
    return None

