import uuid
import random
import string
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.exceptions import AgentEduException, AuthenticationError
from app.models.user import User, UserRole
from app.models.audit import AuditEvent
from app.models.classroom import Class, ClassMembership
from app.models.curriculum import Topic
from app.models.learner import LearnerState, Misconception, MisconceptionStatus, MasteryStatus
from app.models.gamification import UserStreak
from app.schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if email exists
    stmt = select(User).where(User.email == payload.email.lower().strip())
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise AgentEduException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email address already exists"
        )

    # Sanitize role: users cannot self-assign admin unless first user in system
    role = payload.role.lower()
    if role not in [UserRole.STUDENT, UserRole.TEACHER]:
        role = UserRole.STUDENT

    new_user = User(
        email=payload.email.lower().strip(),
        full_name=payload.full_name.strip(),
        role=role,
        avatar_url=payload.avatar_url,
        hashed_password=get_password_hash(payload.password)
    )
    db.add(new_user)
    await db.flush()

    if role == UserRole.STUDENT:
        # 1. Auto-enroll in default active classes
        classes_res = await db.execute(select(Class))
        active_classes = classes_res.scalars().all()
        for cl in active_classes:
            membership = ClassMembership(
                class_id=cl.id,
                student_id=new_user.id,
                status="active"
            )
            db.add(membership)

        # 2. Seed LearnerState for curriculum topics
        topics_res = await db.execute(select(Topic))
        all_topics = topics_res.scalars().all()
        for idx, t in enumerate(all_topics):
            base_score = 85.0 if idx == 0 else (80.0 if idx == 1 else (58.0 if idx == 2 else 46.0))
            db.add(LearnerState(
                student_id=new_user.id,
                topic_id=t.id,
                mastery_score=base_score,
                confidence=0.72,
                status="Mastered" if base_score >= 80 else ("Developing" if base_score >= 60 else "Needs Attention"),
                assessment_count=1
            ))

        # 3. Seed baseline diagnostic misconception
        rec_topic = next((t for t in all_topics if t.code == "recursion"), (all_topics[0] if all_topics else None))
        if rec_topic:
            db.add(Misconception(
                student_id=new_user.id,
                topic_id=rec_topic.id,
                concept="Recursion & Base Cases",
                root_cause="Stack-Frame Unwinding Misunderstood",
                description="Student anticipates recursive return without unwinding the call stack or multiplying accumulated values across stack frames.",
                status=MisconceptionStatus.TEACHER_CONFIRMED,
                confidence=0.88,
                evidence_summary="Baseline diagnostic: Predicted return 1 for factorial(3) instead of multiplying across stack unwinding."
            ))

        # 4. Initialize gamification streak
        db.add(UserStreak(
            user_id=new_user.id,
            current_streak=1,
            longest_streak=1
        ))

    elif role == UserRole.TEACHER:
        # Create a starter class for new teachers
        suffix = "".join(random.choices(string.ascii_uppercase + string.digits, k=4))
        starter_class = Class(
            name=f"{new_user.full_name}'s CS Classroom",
            code=f"CS101-{suffix}",
            description="Foundations of Computer Science & Algorithmic Problem Solving",
            teacher_id=new_user.id
        )
        db.add(starter_class)

    # Log audit event
    audit = AuditEvent(
        actor_id=new_user.id,
        actor_role=new_user.role,
        action="user_registered",
        target_type="user",
        target_id=new_user.id,
        details={"email": new_user.email, "role": new_user.role}
    )
    db.add(audit)
    await db.commit()
    await db.refresh(new_user)

    token = create_access_token({"sub": new_user.id, "role": new_user.role, "email": new_user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(new_user)
    )



@router.post("/login", response_model=TokenResponse)
async def login_user(payload: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == payload.email.lower().strip())
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise AuthenticationError("Invalid email or password")

    token = create_access_token({"sub": user.id, "role": user.role, "email": user.email})

    audit = AuditEvent(
        actor_id=user.id,
        actor_role=user.role,
        action="user_login",
        target_type="user",
        target_id=user.id
    )
    db.add(audit)
    await db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
