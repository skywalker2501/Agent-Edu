from typing import List, Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.ai_workflow import TutorConversation, TutorMessage, TutorMode
from app.models.curriculum import Topic
from app.models.user import User
from app.schemas.tutor import (
    TutorConversationResponse, TutorMessageResponse, TutorMessageRequest,
    TutorChatRequest, TutorChatResponse
)
from app.services.ai_service import AIService
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai-tutor", tags=["Socratic AI Tutor"])


@router.get("/conversations", response_model=List[TutorConversationResponse])
async def list_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(TutorConversation)
        .where(TutorConversation.student_id == current_user.id)
        .options(selectinload(TutorConversation.messages))
        .order_by(TutorConversation.updated_at.desc())
    )
    res = await db.execute(stmt)
    convos = res.scalars().all()
    return [TutorConversationResponse.model_validate(c) for c in convos]


@router.post("/conversations", response_model=TutorConversationResponse)
async def start_conversation(
    payload: TutorMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Lookup topic name if topic_id provided
    topic_name = "Computer Science Foundations"
    if payload.topic_id:
        t_res = await db.execute(select(Topic).where(Topic.id == payload.topic_id))
        t = t_res.scalar_one_or_none()
        if t:
            topic_name = t.name

    convo = TutorConversation(
        student_id=current_user.id,
        topic_id=payload.topic_id,
        mode=payload.mode or TutorMode.EXPLAIN,
        title=f"Tutoring: {topic_name}"
    )
    db.add(convo)
    await db.flush()

    # Add student message
    student_msg = TutorMessage(
        conversation_id=convo.id,
        sender="student",
        content=payload.content
    )
    db.add(student_msg)

    # Generate tutor response via AIService Socratic engine
    tutor_reply_dict = await AIService.socratic_tutor_response(
        topic_name=topic_name,
        mode=convo.mode,
        student_message=payload.content,
        conversation_history=[]
    )

    tutor_msg = TutorMessage(
        conversation_id=convo.id,
        sender="tutor",
        content=tutor_reply_dict.get("content", ""),
        hints=tutor_reply_dict.get("hints"),
        code_snippet=tutor_reply_dict.get("code_snippet")
    )
    db.add(tutor_msg)
    await db.commit()

    # Re-fetch with messages
    stmt = (
        select(TutorConversation)
        .where(TutorConversation.id == convo.id)
        .options(selectinload(TutorConversation.messages))
    )
    res = await db.execute(stmt)
    refreshed = res.scalar_one()
    return TutorConversationResponse.model_validate(refreshed)


@router.post("/conversations/{conversation_id}/messages", response_model=TutorMessageResponse)
async def send_message(
    conversation_id: str,
    payload: TutorMessageRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stmt = (
        select(TutorConversation)
        .where(TutorConversation.id == conversation_id)
        .options(selectinload(TutorConversation.messages))
    )
    res = await db.execute(stmt)
    convo = res.scalar_one_or_none()
    if not convo:
        raise ResourceNotFoundError("TutorConversation", conversation_id)

    if convo.student_id != current_user.id:
        raise PermissionDeniedError("Cannot send messages in another student's conversation")

    if payload.mode:
        convo.mode = payload.mode

    # Add student message
    st_msg = TutorMessage(
        conversation_id=convo.id,
        sender="student",
        content=payload.content
    )
    db.add(st_msg)

    # Lookup topic name
    topic_name = "Computer Science"
    if convo.topic_id:
        t_res = await db.execute(select(Topic).where(Topic.id == convo.topic_id))
        t = t_res.scalar_one_or_none()
        if t:
            topic_name = t.name

    history = [{"sender": m.sender, "content": m.content} for m in convo.messages]

    tutor_reply = await AIService.socratic_tutor_response(
        topic_name=topic_name,
        mode=convo.mode,
        student_message=payload.content,
        conversation_history=history
    )

    tutor_msg = TutorMessage(
        conversation_id=convo.id,
        sender="tutor",
        content=tutor_reply.get("content", ""),
        hints=tutor_reply.get("hints"),
        code_snippet=tutor_reply.get("code_snippet")
    )
    db.add(tutor_msg)
    await db.commit()
    await db.refresh(tutor_msg)

    return TutorMessageResponse.model_validate(tutor_msg)


@router.post("/chat", response_model=TutorChatResponse)
async def tutor_chat(
    payload: TutorChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Direct Socratic AI Tutor interactive chat endpoint.
    Accepts student prompt, current learning mode, and target topic,
    returning structured pedagogical scaffolding, progressive hints, and code snippets
    powered by the OpenRouter AI model.
    """
    topic_name = payload.topic or "Recursion & Data Structures"
    mode = payload.mode or "guide_step_by_step"
    student_text = payload.get_text()

    # Load recent conversation history if conversation_id provided
    history = []
    if payload.conversation_id:
        try:
            stmt = (
                select(TutorMessage)
                .where(TutorMessage.conversation_id == payload.conversation_id)
                .order_by(TutorMessage.created_at.asc())
            )
            res = await db.execute(stmt)
            msgs = res.scalars().all()
            history = [{"role": m.sender, "content": m.content} for m in msgs[-6:]]
        except Exception:
            pass

    tutor_reply = await AIService.socratic_tutor_response(
        topic_name=topic_name,
        mode=mode,
        student_message=student_text,
        conversation_history=history
    )

    content = tutor_reply.get("content", "Let's explore that step by step.")

    suggested = [
        f"Give me a hint on {topic_name}",
        f"Show a worked example for {topic_name}",
        f"Test my understanding of {topic_name}"
    ]

    return TutorChatResponse(
        response=content,
        message=content,
        content=content,
        hints=tutor_reply.get("hints"),
        code_snippet=tutor_reply.get("code_snippet"),
        suggested_followups=suggested,
        conversation_id=payload.conversation_id,
        mode=mode,
        topic=topic_name
    )

