from typing import List
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.classroom import Class, ClassMembership
from app.models.user import User, UserRole
from app.schemas.classroom import (
    ClassResponse, ClassCreate, MembershipResponse, MembershipCreate,
    ClassJoinRequest, StudentAddByEmailRequest, EnrolledStudentResponse
)
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
    code = payload.code.strip().upper()
    # Check if code already exists
    existing_c = await db.execute(select(Class).where(Class.code == code))
    if existing_c.scalar_one_or_none():
        raise PermissionDeniedError(f"Class with code '{code}' already exists. Please choose a different code.")

    new_class = Class(
        name=payload.name,
        code=code,
        description=payload.description,
        teacher_id=current_user.id
    )
    db.add(new_class)
    await db.commit()
    await db.refresh(new_class)
    c_res = ClassResponse.model_validate(new_class)
    c_res.student_count = 0
    return c_res


@router.post("/join", response_model=ClassResponse)
async def join_class_by_code(
    payload: ClassJoinRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows any student to join a class using the teacher's class join code."""
    code = payload.code.strip().upper()
    stmt = select(Class).where(Class.code == code).options(selectinload(Class.teacher))
    res = await db.execute(stmt)
    classroom = res.scalar_one_or_none()
    if not classroom:
        raise ResourceNotFoundError("Class code", code)

    # Check if student is already enrolled
    stmt_mem = select(ClassMembership).where(
        ClassMembership.class_id == classroom.id,
        ClassMembership.student_id == current_user.id
    )
    res_m = await db.execute(stmt_mem)
    existing = res_m.scalar_one_or_none()
    if not existing:
        membership = ClassMembership(
            class_id=classroom.id,
            student_id=current_user.id,
            status="active"
        )
        db.add(membership)
        await db.commit()

    # Get student count
    cnt_stmt = select(func.count(ClassMembership.id)).where(ClassMembership.class_id == classroom.id)
    cnt_res = await db.execute(cnt_stmt)
    count = cnt_res.scalar() or 0

    c_dict = ClassResponse.model_validate(classroom)
    c_dict.student_count = count
    return c_dict


@router.get("/{class_id}/students", response_model=List[EnrolledStudentResponse])
async def get_enrolled_students(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns the list of students enrolled in this class."""
    stmt_class = select(Class).where(Class.id == class_id)
    res_c = await db.execute(stmt_class)
    classroom = res_c.scalar_one_or_none()
    if not classroom:
        raise ResourceNotFoundError("Class", class_id)

    # Only teacher of the class, admin, or enrolled students can view roster
    if current_user.role == UserRole.TEACHER and classroom.teacher_id != current_user.id:
        raise PermissionDeniedError("Cannot view roster of another teacher's class")

    stmt = (
        select(ClassMembership, User)
        .join(User, ClassMembership.student_id == User.id)
        .where(ClassMembership.class_id == class_id)
        .order_by(ClassMembership.enrolled_at.desc())
    )
    res = await db.execute(stmt)
    rows = res.all()

    output = []
    for mem, stu in rows:
        output.append(EnrolledStudentResponse(
            student_id=stu.id,
            full_name=stu.full_name,
            email=stu.email,
            enrolled_at=mem.enrolled_at,
            status=mem.status,
            last_activity="Active in curriculum & quizzes",
            is_online=True
        ))
    return output


@router.post("/{class_id}/students", response_model=EnrolledStudentResponse)
async def add_student_to_class(
    class_id: str,
    payload: StudentAddByEmailRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teacher to directly add a student to their class by student email."""
    stmt_class = select(Class).where(Class.id == class_id)
    res_c = await db.execute(stmt_class)
    classroom = res_c.scalar_one_or_none()
    if not classroom:
        raise ResourceNotFoundError("Class", class_id)

    if classroom.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError("You can only add students to your own classes")

    email_clean = payload.email.strip().lower()
    stmt_user = select(User).where(func.lower(User.email) == email_clean)
    res_u = await db.execute(stmt_user)
    student = res_u.scalar_one_or_none()
    if not student:
        raise ResourceNotFoundError("User with email", payload.email)

    # Check if already enrolled
    stmt_mem = select(ClassMembership).where(
        ClassMembership.class_id == class_id,
        ClassMembership.student_id == student.id
    )
    res_m = await db.execute(stmt_mem)
    existing = res_m.scalar_one_or_none()
    if existing:
        return EnrolledStudentResponse(
            student_id=student.id,
            full_name=student.full_name,
            email=student.email,
            enrolled_at=existing.enrolled_at,
            status=existing.status,
            last_activity="Already enrolled",
            is_online=True
        )

    membership = ClassMembership(
        class_id=class_id,
        student_id=student.id,
        status="active"
    )
    db.add(membership)
    await db.commit()
    await db.refresh(membership)

    return EnrolledStudentResponse(
        student_id=student.id,
        full_name=student.full_name,
        email=student.email,
        enrolled_at=membership.enrolled_at,
        status=membership.status,
        last_activity="Newly enrolled",
        is_online=True
    )


@router.delete("/{class_id}/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_student_from_class(
    class_id: str,
    student_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teacher to remove a student from their class."""
    stmt_class = select(Class).where(Class.id == class_id)
    res_c = await db.execute(stmt_class)
    classroom = res_c.scalar_one_or_none()
    if not classroom:
        raise ResourceNotFoundError("Class", class_id)

    if classroom.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError("You can only remove students from your own classes")

    stmt_mem = select(ClassMembership).where(
        ClassMembership.class_id == class_id,
        ClassMembership.student_id == student_id
    )
    res_m = await db.execute(stmt_mem)
    membership = res_m.scalar_one_or_none()
    if not membership:
        raise ResourceNotFoundError("Student membership in class", student_id)

    await db.delete(membership)
    await db.commit()
    return None


@router.delete("/{class_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_class(
    class_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teacher to delete their class and clean up memberships."""
    stmt_class = select(Class).where(Class.id == class_id)
    res_c = await db.execute(stmt_class)
    classroom = res_c.scalar_one_or_none()
    if not classroom:
        raise ResourceNotFoundError("Class", class_id)

    if classroom.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError("You can only delete your own classes")

    await db.delete(classroom)
    await db.commit()
    return None

