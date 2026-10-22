from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.live_class import LiveClassSession, LiveClassMessage
from app.models.classroom import Class, ClassMembership
from app.models.user import User, UserRole
from app.schemas.live_class import (
    LiveClassStartRequest, LiveClassSessionResponse, SlideSyncRequest,
    LiveChatMessageRequest, LiveChatMessageResponse
)
from app.api.deps import get_current_user, require_teacher
from app.services.gamification_service import GamificationService

router = APIRouter(prefix="/live-classes", tags=["Live Online Classroom & Virtual Teaching"])


DEFAULT_MATERIALS = [
    {
        "slide_num": 0,
        "title": "Welcome to Today's Live Masterclass",
        "content": "Topic: Advanced Tree Traversal & Balancing Techniques\nInstructor: Prof. Alan Turing\nCourse: CS102 Data Structures & Algorithms",
        "code_snippet": "// Welcome to interactive live learning\nSystem.out.println(\"Class in session!\");",
        "notes": "Ensure all students have opened their interactive terminals."
    },
    {
        "slide_num": 1,
        "title": "Mental Models: Call Stack in Depth-First Search",
        "content": "Recursive DFS pushes activation records onto the thread's call stack. A common cognitive misconception is assuming visited nodes are automatically unwound without an explicit backtrack step.",
        "code_snippet": "def dfs(node, visited):\n    if not node or node in visited:\n        return\n    visited.add(node)\n    print(f\"Visited: {node.val}\")\n    dfs(node.left, visited)\n    dfs(node.right, visited)",
        "notes": "Key concept check: What happens if visited is not passed by reference or mutated globally?"
    },
    {
        "slide_num": 2,
        "title": "Live Interactive Coding Challenge",
        "content": "Given a binary tree root, determine if it is height-balanced (height difference between left and right subtrees <= 1).",
        "code_snippet": "class Solution:\n    def isBalanced(self, root: Optional[TreeNode]) -> bool:\n        def check(node):\n            if not node: return 0\n            lh = check(node.left)\n            if lh == -1: return -1\n            rh = check(node.right)\n            if rh == -1: return -1\n            if abs(lh - rh) > 1: return -1\n            return max(lh, rh) + 1\n        return check(root) != -1",
        "notes": "Time Complexity: O(N) single-pass postorder traversal. Space Complexity: O(H) recursion stack."
    },
    {
        "slide_num": 3,
        "title": "Live Q&A & Socratic Exploration",
        "content": "Ask questions in the live chat or request a walkthrough of edge cases (empty tree, skewed linked-list tree, single node).",
        "code_snippet": "# Post your questions in the Live Class Chat panel!",
        "notes": "Teacher will answer high-priority questions live on screen."
    }
]


@router.post("", response_model=LiveClassSessionResponse, status_code=status.HTTP_201_CREATED)
async def start_live_class(
    payload: LiveClassStartRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teacher to start a live teaching session and upload lecture slides/materials."""
    stmt_c = select(Class).where(Class.id == payload.class_id)
    res_c = await db.execute(stmt_c)
    classroom = res_c.scalar_one_or_none()
    if not classroom:
        raise ResourceNotFoundError("Class", payload.class_id)

    slides_data = [s.model_dump() for s in payload.slides] if payload.slides else DEFAULT_MATERIALS

    session = LiveClassSession(
        class_id=payload.class_id,
        teacher_id=current_user.id,
        title=payload.title,
        description=payload.description or f"Live interactive lecture on {classroom.name}",
        status="live",
        materials_json=slides_data,
        current_slide=0,
        active_attendees_count=1
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Post initial welcome message from teacher
    welcome_msg = LiveClassMessage(
        session_id=session.id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_role="teacher",
        message=f"Welcome everyone! Class has started: '{session.title}'. Feel free to ask questions here anytime.",
        is_question=False
    )
    db.add(welcome_msg)
    await db.commit()

    return LiveClassSessionResponse(
        id=session.id,
        class_id=session.class_id,
        teacher_id=session.teacher_id,
        teacher_name=current_user.full_name,
        class_name=classroom.name,
        title=session.title,
        description=session.description,
        status=session.status,
        materials_json=session.materials_json,
        current_slide=session.current_slide,
        active_attendees_count=session.active_attendees_count,
        started_at=session.started_at,
        ended_at=session.ended_at
    )


@router.get("/active", response_model=List[LiveClassSessionResponse])
async def get_active_live_classes(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns currently active live sessions that the student or teacher is enrolled in."""
    if current_user.role == UserRole.TEACHER:
        stmt = (
            select(LiveClassSession, Class, User)
            .join(Class, LiveClassSession.class_id == Class.id)
            .join(User, LiveClassSession.teacher_id == User.id)
            .where(LiveClassSession.status == "live", LiveClassSession.teacher_id == current_user.id)
        )
    elif current_user.role == UserRole.STUDENT:
        # Enrolled classes
        stmt = (
            select(LiveClassSession, Class, User)
            .join(Class, LiveClassSession.class_id == Class.id)
            .join(ClassMembership, ClassMembership.class_id == Class.id)
            .join(User, LiveClassSession.teacher_id == User.id)
            .where(LiveClassSession.status == "live", ClassMembership.student_id == current_user.id)
        )
    else:
        stmt = (
            select(LiveClassSession, Class, User)
            .join(Class, LiveClassSession.class_id == Class.id)
            .join(User, LiveClassSession.teacher_id == User.id)
            .where(LiveClassSession.status == "live")
        )

    res = await db.execute(stmt)
    rows = res.all()

    output = []
    for session, classroom, teacher in rows:
        output.append(LiveClassSessionResponse(
            id=session.id,
            class_id=session.class_id,
            teacher_id=session.teacher_id,
            teacher_name=teacher.full_name,
            class_name=classroom.name,
            title=session.title,
            description=session.description,
            status=session.status,
            materials_json=session.materials_json,
            current_slide=session.current_slide,
            active_attendees_count=session.active_attendees_count,
            started_at=session.started_at,
            ended_at=session.ended_at
        ))
    return output


@router.get("/{session_id}", response_model=LiveClassSessionResponse)
async def get_live_class(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(LiveClassSession, Class, User)
        .join(Class, LiveClassSession.class_id == Class.id)
        .join(User, LiveClassSession.teacher_id == User.id)
        .where(LiveClassSession.id == session_id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise ResourceNotFoundError("LiveClassSession", session_id)

    session, classroom, teacher = row
    return LiveClassSessionResponse(
        id=session.id,
        class_id=session.class_id,
        teacher_id=session.teacher_id,
        teacher_name=teacher.full_name,
        class_name=classroom.name,
        title=session.title,
        description=session.description,
        status=session.status,
        materials_json=session.materials_json,
        current_slide=session.current_slide,
        active_attendees_count=session.active_attendees_count,
        started_at=session.started_at,
        ended_at=session.ended_at
    )


@router.post("/{session_id}/slide", response_model=LiveClassSessionResponse)
async def sync_slide(
    session_id: str,
    payload: SlideSyncRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teacher to advance or change slide, synchronizing across all connected students."""
    stmt = select(LiveClassSession).where(LiveClassSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise ResourceNotFoundError("LiveClassSession", session_id)

    if session.teacher_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise PermissionDeniedError("Only the session teacher can control the presentation")

    session.current_slide = payload.current_slide
    await db.commit()
    await db.refresh(session)

    stmt_full = (
        select(LiveClassSession, Class, User)
        .join(Class, LiveClassSession.class_id == Class.id)
        .join(User, LiveClassSession.teacher_id == User.id)
        .where(LiveClassSession.id == session_id)
    )
    res_full = await db.execute(stmt_full)
    session, classroom, teacher = res_full.first()

    return LiveClassSessionResponse(
        id=session.id,
        class_id=session.class_id,
        teacher_id=session.teacher_id,
        teacher_name=teacher.full_name,
        class_name=classroom.name,
        title=session.title,
        description=session.description,
        status=session.status,
        materials_json=session.materials_json,
        current_slide=session.current_slide,
        active_attendees_count=session.active_attendees_count,
        started_at=session.started_at,
        ended_at=session.ended_at
    )


@router.post("/{session_id}/attend")
async def attend_live_class(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Student joins live class; increments attendee count and awards live attendance XP."""
    stmt = select(LiveClassSession).where(LiveClassSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise ResourceNotFoundError("LiveClassSession", session_id)

    session.active_attendees_count = (session.active_attendees_count or 1) + 1
    await db.commit()

    # Award student 50 XP for live class attendance
    if current_user.role == UserRole.STUDENT:
        try:
            await GamificationService.award_xp(
                db=db,
                user_id=current_user.id,
                amount=50,
                source_type="live_class_attendance",
                source_id=session.id,
                description=f"Attended live class: {session.title}"
            )
        except Exception:
            pass

    return {"status": "attended", "active_attendees": session.active_attendees_count, "xp_awarded": 50}


@router.post("/{session_id}/end")
async def end_live_class(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_teacher)
):
    """Allows teacher to end the live class session."""
    stmt = select(LiveClassSession).where(LiveClassSession.id == session_id)
    res = await db.execute(stmt)
    session = res.scalar_one_or_none()
    if not session:
        raise ResourceNotFoundError("LiveClassSession", session_id)

    session.status = "ended"
    session.ended_at = datetime.now(timezone.utc)
    await db.commit()
    return {"status": "ended"}


@router.get("/{session_id}/chat", response_model=List[LiveChatMessageResponse])
async def get_chat_messages(
    session_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns recent Q&A chat messages for the live class."""
    stmt = (
        select(LiveClassMessage)
        .where(LiveClassMessage.session_id == session_id)
        .order_by(LiveClassMessage.created_at.asc())
        .limit(100)
    )
    res = await db.execute(stmt)
    msgs = res.scalars().all()
    return [LiveChatMessageResponse.model_validate(m) for m in msgs]


@router.post("/{session_id}/chat", response_model=LiveChatMessageResponse)
async def post_chat_message(
    session_id: str,
    payload: LiveChatMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Posts a question or message to the live class chat."""
    msg = LiveClassMessage(
        session_id=session_id,
        user_id=current_user.id,
        user_name=current_user.full_name,
        user_role=current_user.role,
        message=payload.message.strip(),
        is_question=payload.is_question
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return LiveChatMessageResponse.model_validate(msg)
