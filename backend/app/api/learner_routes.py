from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.exceptions import PermissionDeniedError, ResourceNotFoundError
from app.models.user import User, UserRole
from app.models.curriculum import Topic, TopicPrerequisite
from app.models.classroom import Class, ClassMembership
from app.models.learner import LearnerState, Misconception, MisconceptionRelationship, LearningEvent, MisconceptionStatus
from app.schemas.learner import DigitalTwinSummary, LearnerStateResponse, MisconceptionResponse, MisconceptionRelationshipView
from app.api.deps import get_current_user

router = APIRouter(prefix="/learner-model", tags=["Learner Digital Twin & Knowledge Graph"])


@router.get("", response_model=DigitalTwinSummary)
async def get_learner_model(
    student_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_student_id = current_user.id
    if student_id:
        if current_user.role == UserRole.STUDENT and student_id != current_user.id:
            raise PermissionDeniedError("Students cannot access another learner's digital twin")
        target_student_id = student_id

    # Fetch user info
    target_user_res = await db.execute(select(User).where(User.id == target_student_id))
    target_user = target_user_res.scalar_one_or_none()
    if not target_user:
        raise ResourceNotFoundError("Student", target_student_id)

    # Fetch learner states with topics
    stmt_ls = (
        select(LearnerState)
        .where(LearnerState.student_id == target_student_id)
        .options(selectinload(LearnerState.topic))
    )
    res_ls = await db.execute(stmt_ls)
    lstates = res_ls.scalars().all()

    if not lstates:
        # Initialize baseline diagnostic knowledge state across curriculum
        topics_res = await db.execute(select(Topic))
        all_topics = topics_res.scalars().all()
        for idx, t in enumerate(all_topics):
            base_score = 85.0 if idx == 0 else (80.0 if idx == 1 else (58.0 if idx == 2 else 46.0))
            ns = LearnerState(
                student_id=target_student_id,
                topic_id=t.id,
                mastery_score=base_score,
                confidence=0.72,
                status="Mastered" if base_score >= 80 else ("Developing" if base_score >= 60 else "Needs Attention"),
                assessment_count=1
            )
            db.add(ns)
        await db.commit()
        res_ls = await db.execute(stmt_ls)
        lstates = res_ls.scalars().all()

    # Fetch active misconceptions
    stmt_misc = (
        select(Misconception)
        .where(
            Misconception.student_id == target_student_id,
            Misconception.status != MisconceptionStatus.REJECTED
        )
        .options(
            selectinload(Misconception.relationships).selectinload(MisconceptionRelationship.prerequisite_topic)
        )
    )
    res_misc = await db.execute(stmt_misc)
    misconceptions = res_misc.scalars().all()

    if not misconceptions:
        t_res = await db.execute(select(Topic).where(Topic.code == "recursion"))
        rec_topic = t_res.scalar_one_or_none() or (await db.execute(select(Topic).limit(1))).scalar_one_or_none()
        if rec_topic:
            demo_misc = Misconception(
                student_id=target_student_id,
                topic_id=rec_topic.id,
                concept="Recursion & Base Cases",
                root_cause="Stack-Frame Unwinding Misunderstood",
                description="Student anticipates recursive return without unwinding the call stack or multiplying accumulated values across stack frames.",
                status=MisconceptionStatus.TEACHER_CONFIRMED,
                confidence=0.88,
                evidence_summary="Predicted return 1 for factorial(3) instead of multiplying across stack unwinding."
            )
            db.add(demo_misc)
            await db.commit()
            res_misc = await db.execute(stmt_misc)
            misconceptions = res_misc.scalars().all()

    # Fetch recent events
    stmt_events = (
        select(LearningEvent)
        .where(LearningEvent.student_id == target_student_id)
        .order_by(LearningEvent.created_at.desc())
        .limit(10)
    )
    res_events = await db.execute(stmt_events)
    events = res_events.scalars().all()

    # Calculate overall progress
    total_mastery = sum(s.mastery_score for s in lstates) if lstates else 0.0
    overall_progress = round(total_mastery / len(lstates), 1) if lstates else 0.0
    topics_mastered = sum(1 for s in lstates if s.mastery_score >= 80.0)
    topics_needing_attention = sum(1 for s in lstates if s.mastery_score < 60.0 and s.mastery_score > 0)
    active_misc_count = sum(1 for m in misconceptions if m.status in [MisconceptionStatus.HYPOTHESIS, MisconceptionStatus.TEACHER_CONFIRMED])

    ls_responses = [
        LearnerStateResponse(
            id=s.id,
            student_id=s.student_id,
            topic_id=s.topic_id,
            topic_name=s.topic.name if s.topic else "General",
            topic_code=s.topic.code if s.topic else "general",
            mastery_score=s.mastery_score,
            confidence=s.confidence,
            status=s.status,
            assessment_count=s.assessment_count,
            version=s.version,
            last_updated=s.last_updated
        )
        for s in lstates
    ]

    misc_responses = []
    for m in misconceptions:
        rel_views = [
            MisconceptionRelationshipView(
                id=r.id,
                prerequisite_topic_id=r.prerequisite_topic_id,
                prerequisite_topic_name=r.prerequisite_topic.name if r.prerequisite_topic else None,
                strength=r.strength,
                explanation=r.explanation
            )
            for r in m.relationships
        ]
        misc_responses.append(
            MisconceptionResponse(
                id=m.id,
                student_id=m.student_id,
                topic_id=m.topic_id,
                title=f"{m.concept}: {m.root_cause}" if (m.concept and m.root_cause) else (m.concept or "Cognitive Misconception"),
                concept=m.concept,
                root_cause=m.root_cause,
                description=m.description,
                status=m.status,
                confidence=m.confidence,
                evidence_summary=m.evidence_summary,
                supporting_evidence=m.supporting_evidence,
                detected_at=m.detected_at,
                resolved_at=m.resolved_at,
                relationships=rel_views
            )
        )

    return DigitalTwinSummary(
        student_id=target_student_id,
        student_name=target_user.full_name,
        overall_progress=overall_progress,
        topics_mastered=topics_mastered,
        topics_needing_attention=topics_needing_attention,
        active_misconceptions_count=active_misc_count,
        learner_states=ls_responses,
        misconceptions=misc_responses,
        recent_events=[
            {"event_type": e.event_type, "payload": e.payload, "created_at": e.created_at.isoformat()}
            for e in events
        ]
    )


@router.get("/knowledge-map")
async def get_knowledge_map(
    student_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns graph nodes and edges for visual knowledge graph rendering.
    Combines:
    - Topic nodes with current mastery state
    - Misconception nodes with status
    - Prerequisite edges
    - Root-cause links
    """
    target_student_id = current_user.id
    if student_id:
        if current_user.role == UserRole.STUDENT and student_id != current_user.id:
            raise PermissionDeniedError("Students cannot access another learner's knowledge map")
        target_student_id = student_id

    # Fetch topics
    topics_res = await db.execute(select(Topic))
    topics = topics_res.scalars().all()

    # Fetch learner states
    stmt_ls = select(LearnerState).where(LearnerState.student_id == target_student_id)
    ls_res = await db.execute(stmt_ls)
    mastery_map = {s.topic_id: s.mastery_score for s in ls_res.scalars().all()}

    # Fetch prerequisites
    prereqs_res = await db.execute(select(TopicPrerequisite))
    prereqs = prereqs_res.scalars().all()

    # Fetch student misconceptions
    stmt_m = (
        select(Misconception)
        .where(Misconception.student_id == target_student_id)
        .options(selectinload(Misconception.relationships))
    )
    m_res = await db.execute(stmt_m)
    misconceptions = m_res.scalars().all()

    nodes = []
    edges = []

    # 1. Topic Nodes
    for t in topics:
        mastery = mastery_map.get(t.id, 0.0)
        status_color = "#10B981" if mastery >= 80 else ("#F59E0B" if mastery >= 60 else ("#EF4444" if mastery > 0 else "#64748B"))
        nodes.append({
            "id": f"topic_{t.id}",
            "label": t.name,
            "type": "topic",
            "category": t.category,
            "mastery": mastery,
            "color": status_color
        })

    # 2. Prerequisite Edges
    for p in prereqs:
        edges.append({
            "id": f"prereq_{p.id}",
            "source": f"topic_{p.prerequisite_topic_id}",
            "target": f"topic_{p.topic_id}",
            "label": "Prerequisite",
            "type": "prerequisite",
            "strength": p.strength
        })

    # 3. Misconception Nodes and Root-Cause Edges
    for m in misconceptions:
        if m.status != MisconceptionStatus.REJECTED:
            nodes.append({
                "id": f"misc_{m.id}",
                "label": f"Misconception: {m.root_cause}",
                "type": "misconception",
                "status": m.status,
                "confidence": m.confidence,
                "color": "#EF4444" if m.status in ["Hypothesis", "Teacher Confirmed"] else "#10B981"
            })
            # Edge from topic to misconception
            edges.append({
                "id": f"edge_tm_{m.id}",
                "source": f"topic_{m.topic_id}",
                "target": f"misc_{m.id}",
                "label": "Observed Gap",
                "type": "observed_gap"
            })
            # Edges from misconception to root-cause prerequisites
            for r in m.relationships:
                edges.append({
                    "id": f"edge_rel_{r.id}",
                    "source": f"misc_{m.id}",
                    "target": f"topic_{r.prerequisite_topic_id}",
                    "label": "Root Cause Dependency",
                    "type": "root_cause_dependency",
                    "strength": r.strength
                })

    return {
        "nodes": nodes,
        "edges": edges,
        "student_id": target_student_id
    }


@router.get("/dashboard")
async def get_student_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns aggregated dashboard summary for student portal, including
    enrolled classes, active assessments, pending interventions, and mastery.
    """
    student_id = current_user.id

    from app.models.classroom import ClassMembership, Class
    from app.models.assessment import Assessment
    from app.models.intervention import Intervention

    # 1. Enrolled classes
    res_classes = await db.execute(
        select(Class)
        .join(ClassMembership, ClassMembership.class_id == Class.id)
        .where(ClassMembership.student_id == student_id)
    )
    enrolled_classes = res_classes.scalars().all()

    # 2. Active assessments
    res_ass = await db.execute(
        select(Assessment).where(Assessment.is_active == True).limit(5)
    )
    active_assessments = res_ass.scalars().all()

    # 3. Interventions
    res_int = await db.execute(
        select(Intervention).where(Intervention.student_id == student_id).limit(5)
    )
    pending_interventions = res_int.scalars().all()

    # 4. Mastery summary
    res_ls = await db.execute(
        select(LearnerState)
        .where(LearnerState.student_id == student_id)
        .options(selectinload(LearnerState.topic))
    )
    lstates = res_ls.scalars().all()
    mastery_summary = {
        (s.topic.name if s.topic else "General"): round(s.mastery_score if s.mastery_score <= 100.0 else s.mastery_score / 100.0, 1)
        for s in lstates
    }

    # 5. Recent events
    res_events = await db.execute(
        select(LearningEvent)
        .where(LearningEvent.student_id == student_id)
        .order_by(LearningEvent.created_at.desc())
        .limit(5)
    )
    recent_events = res_events.scalars().all()

    # 6. Active Misconceptions & Knowledge Gaps
    stmt_misc = (
        select(Misconception)
        .where(
            Misconception.student_id == student_id,
            Misconception.status != MisconceptionStatus.REJECTED
        )
    )
    misconceptions = (await db.execute(stmt_misc)).scalars().all()
    
    knowledge_gaps = []
    for s in lstates:
        if s.mastery_score < 70.0:
            knowledge_gaps.append({
                "topic_id": s.topic_id,
                "topic_name": s.topic.name if s.topic else "General",
                "mastery_score": round(s.mastery_score, 1),
                "severity": "critical" if s.mastery_score < 50.0 else "medium",
                "reason": f"Topic mastery is {round(s.mastery_score, 1)}% (below target threshold 70%)"
            })
    for m in misconceptions:
        knowledge_gaps.append({
            "topic_id": m.topic_id,
            "topic_name": m.concept,
            "misconception_id": m.id,
            "root_cause": m.root_cause,
            "severity": "critical" if m.status == MisconceptionStatus.TEACHER_CONFIRMED else "high",
            "reason": f"Diagnosed mental model gap: {m.root_cause}"
        })

    return {
        "student_id": student_id,
        "enrolled_classes": [
            {"id": c.id, "name": c.name, "code": c.code, "description": c.description}
            for c in enrolled_classes
        ],
        "active_assessments": [
            {
                "id": a.id,
                "title": a.title,
                "assessment_type": a.assessment_type,
                "time_limit_minutes": a.time_limit_minutes,
                "description": a.description
            }
            for a in active_assessments
        ],
        "pending_interventions": [
            {
                "id": i.id,
                "target_concept": i.target_concept,
                "status": i.status,
                "selected_strategy": i.selected_strategy
            }
            for i in pending_interventions
        ],
        "mastery_summary": mastery_summary,
        "knowledge_gaps": knowledge_gaps,
        "active_misconceptions": [
            {
                "id": m.id,
                "concept": m.concept,
                "root_cause": m.root_cause,
                "title": f"{m.concept}: {m.root_cause}",
                "description": m.description,
                "status": m.status,
                "confidence": m.confidence,
                "evidence_summary": m.evidence_summary
            }
            for m in misconceptions
        ],
        "recent_events": [
            {"id": e.id, "event_type": e.event_type, "created_at": str(e.created_at)}
            for e in recent_events
        ]
    }


# In-memory thread-safe store for live student activity telemetry
from datetime import datetime, timezone
from pydantic import BaseModel

class ActivityHeartbeatRequest(BaseModel):
    current_page: str
    activity_label: str
    class_id: Optional[str] = None


class TeacherGuidanceRequest(BaseModel):
    student_id: str
    guidance_message: Optional[str] = None
    message: Optional[str] = None

    @property
    def text(self) -> str:
        return self.message or self.guidance_message or "Teacher guidance"


_LIVE_STUDENT_TELEMETRY: Dict[str, Dict[str, Any]] = {}


@router.post("/heartbeat")
async def student_activity_heartbeat(
    payload: ActivityHeartbeatRequest,
    current_user: User = Depends(get_current_user)
):
    """Real-time telemetry heartbeat from student browser."""
    now = datetime.now(timezone.utc)
    _LIVE_STUDENT_TELEMETRY[current_user.id] = {
        "student_id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "class_id": payload.class_id,
        "current_page": payload.current_page,
        "activity_label": payload.activity_label,
        "last_heartbeat": now.isoformat(),
        "is_online": True
    }
    return {"status": "recorded", "timestamp": now.isoformat()}


@router.get("/live-activity")
async def get_live_student_activity(
    class_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Teacher Live Student Activity Radar:
    Returns the real-time activity and status of all students in the teacher's classes.
    """
    now = datetime.now(timezone.utc)
    
    # Get all students in teacher's classes
    stmt = (
        select(User, ClassMembership, Class)
        .join(ClassMembership, ClassMembership.student_id == User.id)
        .join(Class, ClassMembership.class_id == Class.id)
    )
    if class_id:
        stmt = stmt.where(Class.id == class_id)
    elif current_user.role == UserRole.TEACHER:
        stmt = stmt.where(Class.teacher_id == current_user.id)

    res = await db.execute(stmt)
    rows = res.all()

    students_map: Dict[str, Dict[str, Any]] = {}

    for student, membership, classroom in rows:
        telemetry = _LIVE_STUDENT_TELEMETRY.get(student.id)
        is_online = False
        current_task = "Studying curriculum materials"
        current_page = "/student/dashboard"
        
        if telemetry:
            try:
                lh = datetime.fromisoformat(telemetry["last_heartbeat"])
                diff = (now - lh).total_seconds()
                if diff < 120:  # Online within last 2 minutes
                    is_online = True
                    current_task = telemetry.get("activity_label", current_task)
                    current_page = telemetry.get("current_page", current_page)
                elif diff < 300:
                    current_task = f"Idle ({round(diff/60)}m ago): {telemetry.get('activity_label', current_task)}"
            except Exception:
                pass

        # Check for active misconceptions
        misc_stmt = select(func.count(Misconception.id)).where(
            Misconception.student_id == student.id,
            Misconception.status != MisconceptionStatus.REJECTED
        )
        misc_cnt = (await db.execute(misc_stmt)).scalar() or 0

        students_map[student.id] = {
            "student_id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "class_id": classroom.id,
            "class_name": classroom.name,
            "is_online": is_online,
            "current_task": current_task,
            "current_page": current_page,
            "active_misconceptions": misc_cnt,
            "needs_intervention": misc_cnt > 0,
            "last_active": telemetry.get("last_heartbeat") if telemetry else str(membership.enrolled_at)
        }

    return list(students_map.values())


@router.post("/send-guidance")
@router.post("/guide")
async def send_teacher_guidance(
    payload: TeacherGuidanceRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Allows teacher to push real-time pedagogical guidance/hint to an active student."""
    from app.models.audit import Notification
    text = payload.text
    notif = Notification(
        user_id=payload.student_id,
        title=f"Direct Guidance from {current_user.full_name}",
        message=text,
        notification_type="teacher_guidance"
    )
    db.add(notif)
    await db.commit()
    return {"status": "sent", "recipient_id": payload.student_id, "message": text}


