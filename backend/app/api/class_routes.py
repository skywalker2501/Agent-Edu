from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.classroom import Class, ClassMembership
from app.models.user import User, UserRole
from app.schemas.classroom import ClassResponse, ClassCreate, MembershipResponse, MembershipCreate
from app.api.deps import get_current_user, require_teacher

router = APIRouter(prefix="/classes", tags=["Classes & Enrollment"])


@router.get("", response_model=List[ClassResponse])
async def list_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == UserRole.TEACHER:
        stmt = select(Class).where(Class.teacher_id == current_user.id).options(selectinload(Class.teacher))
    elif current_user.role == UserRole.STUDENT:
        # Return classes the student is enrolled in
        stmt = (
            select(Class)
            .join(ClassMembership, ClassMembership.class_id == Class.id)
            .where(ClassMembership.student_id == current_user.id)
            .options(selectinload(Class.teacher))
        )
    else:
        stmt = select(Class).options(selectinload(Class.teacher))

    res = await db.execute(stmt)
    classes = res.scalars().all()

    output = []
    for c in classes:
        # Count members
        cnt_stmt = select(func.count(ClassMembership.id)).where(ClassMembership.class_id == c.id)
        cnt_res = await db.execute(cnt_stmt)
        count = cnt_res.scalar() or 0

        c_dict = ClassResponse.model_validate(c)
        c_dict.student_count = count
        output.append(c_dict)

    return output


@router.post("", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
async def create_class(
    payload: ClassCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    new_class = Class(
        name=payload.name,
        code=payload.code.strip().upper(),
        description=payload.description,
        teacher_id=current_user.id
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    return ClassResponse.model_validate(new_class)


@router.post("/{class_id}/enroll", response_model=MembershipResponse)
async def enroll_student(
    class_id: str,
    payload: MembershipCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only teacher of class or admin, or the student enrolling themselves with code can enroll
    stmt_class = select(Class).where(Class.id == class_id)
    res_c = await db.execute(stmt_class)
    c = res_c.scalar_one_or_none()
    if not c:
        raise ResourceNotFoundError("Class", class_id)

    if current_user.role == UserRole.STUDENT and payload.student_id != current_user.id:
        raise PermissionDeniedError("Cannot enroll another student")

    # Check if already enrolled
    stmt_mem = select(ClassMembership).where(
        ClassMembership.class_id == class_id,
        ClassMembership.student_id == payload.student_id
    )
    res_m = await db.execute(stmt_mem)
    existing = res_m.scalar_one_or_none()
    if existing:
        return MembershipResponse.model_validate(existing)

    membership = ClassMembership(
        class_id=class_id,
        student_id=payload.student_id,
        status="active"
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)
    return MembershipResponse.model_validate(membership)
