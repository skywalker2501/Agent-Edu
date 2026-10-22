from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import ResourceNotFoundError, PermissionDeniedError
from app.models.ai_workflow import TutorConversation, TutorMessage, TutorMode
from app.models.curriculum import Topic
from app.models.audit import LearningResource
from app.models.user import User
from app.schemas.tutor import (
    TutorConversationResponse, TutorMessageResponse, TutorMessageRequest,
    TutorChatRequest, TutorChatResponse
)
from app.services.ai_service import AIService
from app.api.deps import get_current_user

router = APIRouter(prefix="/ai-tutor", tags=["Socratic AI Tutor"])


async def _get_rag_grounding_materials(db: AsyncSession, topic_id: Optional[str], topic_name: str) -> List[dict]:
    """Retrieves approved syllabus materials for RAG grounding."""
    try:
        conditions = [LearningResource.is_approved == True]
        if topic_id:
            conditions.append(LearningResource.topic_id == topic_id)
        else:
            conditions.append(LearningResource.title.ilike(f"%{topic_name}%"))
        
        stmt = select(LearningResource).where(*conditions).limit(3)
        res = await db.execute(stmt)
        resources = res.scalars().all()
        return [{"title": r.title, "content": r.content, "resource_type": r.resource_type} for r in resources]
    except Exception:
        return []


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

    student_msg = TutorMessage(
        conversation_id=convo.id,
        sender="student",
        content=payload.content
    )
    db.add(student_msg)

    # RAG grounding query
    rag_context = await _get_rag_grounding_materials(db, payload.topic_id, topic_name)

    # Generate tutor response via AIService Socratic engine (Ollama primary with Gemini/rule-based fallback)
    tutor_reply_dict = await AIService.socratic_tutor_response(
        topic_name=topic_name,
        mode=convo.mode,
        student_message=payload.content,
        conversation_history=[],
        rag_context=rag_context
    )

    tutor_msg = TutorMessage(
        conversation_id=convo.id,
        sender="tutor",
        content=tutor_reply_dict.get("content", ""),
        hints=tutor_reply_dict.get("hints"),
        code_snippet=tutor_reply_dict.get("code_snippet"),
        citations=tutor_reply_dict.get("citations"),
        model_name=tutor_reply_dict.get("model_name"),
        rag_sources=rag_context
    )
    db.add(tutor_msg)
    await db.commit()

    stmt = (
        select(TutorConversation)
        .where(TutorConversation.id == convo.id)
        .options(selectinload(TutorConversation.messages))
    )
    res = await db.execute(stmt)
    refreshed = res.scalar_one()
    return TutorConversationResponse.model_validate(refreshed)


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows a student to delete their own conversation history."""
    stmt = select(TutorConversation).where(TutorConversation.id == conversation_id)
    res = await db.execute(stmt)
    convo = res.scalar_one_or_none()
    if not convo:
        raise ResourceNotFoundError("TutorConversation", conversation_id)

    if convo.student_id != current_user.id and current_user.role != "admin":
        raise PermissionDeniedError("Cannot delete another user's conversation")

    await db.delete(convo)
    await db.commit()
    return None


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

    st_msg = TutorMessage(
        conversation_id=convo.id,
        sender="student",
        content=payload.content
    )
    db.add(st_msg)

    topic_name = "Computer Science"
    if convo.topic_id:
        t_res = await db.execute(select(Topic).where(Topic.id == convo.topic_id))
        t = t_res.scalar_one_or_none()
        if t:
            topic_name = t.name

    history = [{"role": m.sender, "content": m.content} for m in convo.messages]
    rag_context = await _get_rag_grounding_materials(db, convo.topic_id, topic_name)

    tutor_reply = await AIService.socratic_tutor_response(
        topic_name=topic_name,
        mode=convo.mode,
        student_message=payload.content,
        conversation_history=history,
        rag_context=rag_context
    )

    tutor_msg = TutorMessage(
        conversation_id=convo.id,
        sender="tutor",
        content=tutor_reply.get("content", ""),
        hints=tutor_reply.get("hints"),
        code_snippet=tutor_reply.get("code_snippet"),
        citations=tutor_reply.get("citations"),
        model_name=tutor_reply.get("model_name"),
        rag_sources=rag_context
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
    Powered by Ollama local LLM with configurable model and fallback chain.
    """
    topic_name = payload.topic or "Recursion & Data Structures"
    mode = payload.mode or "guide_step_by_step"
    student_text = payload.get_text()

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

    rag_context = await _get_rag_grounding_materials(db, None, topic_name)

    tutor_reply = await AIService.socratic_tutor_response(
        topic_name=topic_name,
        mode=mode,
        student_message=student_text,
        conversation_history=history,
        rag_context=rag_context
    )

    content = tutor_reply.get("content", "Let's explore that step by step.")
    model_name = tutor_reply.get("model_name", "llama3.2:3b")
    provider = tutor_reply.get("provider", "ollama")
    is_fallback = tutor_reply.get("is_fallback", False)
    citations = tutor_reply.get("citations", [])

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
        citations=citations,
        model_name=model_name,
        provider=provider,
        is_fallback=is_fallback,
        suggested_followups=suggested,
        conversation_id=payload.conversation_id,
        mode=mode,
        topic=topic_name
    )
