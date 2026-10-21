from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.agents.observer_agent import ObservationEvidence


class DiagnosedMisconceptionItem(BaseModel):
    topic_id: str
    topic_code: str
    concept: str
    root_cause: str
    description: str
    status: str = "Hypothesis"  # Hypothesis, Teacher Confirmed, Rejected, Uncertain
    confidence: float = 0.85
    prerequisite_gap_topic_id: Optional[str] = None
    prerequisite_gap_topic_name: Optional[str] = None
    supporting_evidence_ids: List[str] = []
    evidence_summary: str


class DiagnosticReport(BaseModel):
    student_id: str
    assessment_id: str
    weak_topics: List[str] = []
    misconception_hypotheses: List[DiagnosedMisconceptionItem] = []
    overall_diagnosis_summary: str
    requires_teacher_validation: bool = True


class CognitiveDiagnosticAgent:
    """
    Agent 2: Cognitive Diagnostic Agent
    Identifies root-cause cognitive misconceptions, prerequisite gaps, and repeated
    error patterns behind observed learning failures.
    
    Guarantees:
    - Never turns a single isolated incorrect answer into a confirmed permanent misconception.
    - Labels initial inferences as 'Hypothesis' requiring teacher validation.
    - Explicitly identifies prerequisite conceptual dependencies.
    """

    @classmethod
    def diagnose(
        cls,
        evidence: ObservationEvidence,
        topics_by_id: Dict[str, Any],
        topic_prerequisites_map: Dict[str, List[Any]]
    ) -> DiagnosticReport:
        weak_topics = []
        misconceptions = []

        # 1. Identify weak topics from topic breakdown (< 60% threshold)
        for tid, data in evidence.topic_breakdown.items():
            pct = data.get("percentage", 0.0)
            if pct < 60.0:
                weak_topics.append(tid)

        # 2. Check question error patterns per topic
        topic_error_counts: Dict[str, int] = {}
        topic_total_counts: Dict[str, int] = {}
        for qe in evidence.questions_evidence:
            tid = qe.topic_id
            if tid:
                topic_total_counts[tid] = topic_total_counts.get(tid, 0) + 1
                if not qe.is_correct:
                    topic_error_counts[tid] = topic_error_counts.get(tid, 0) + 1

        for tid in weak_topics:
            topic_obj = topics_by_id.get(tid)
            t_code = topic_obj.code if topic_obj else "unknown"
            t_name = topic_obj.name if topic_obj else "Unknown Topic"

            err_count = topic_error_counts.get(tid, 0)
            tot_count = topic_total_counts.get(tid, 1)

            # Check if there is repeated error evidence (>= 2 incorrect answers or > 50% failed)
            is_repeated_pattern = (err_count >= 2) or (tot_count > 0 and (err_count / tot_count) >= 0.5)

            # Retrieve prerequisite relations from ontology
            prereqs = topic_prerequisites_map.get(tid, [])
            prereq_id = prereqs[0].prerequisite_topic_id if prereqs else None
            prereq_obj = topics_by_id.get(prereq_id) if prereq_id else None
            prereq_name = prereq_obj.name if prereq_obj else "Underlying Computational Foundations"

            # Check specific domain patterns (Recursion -> Stack-frame misconception)
            if "recursion" in t_code.lower() or "recursion" in t_name.lower():
                evidence_qids = [
                    qe.question_id for qe in evidence.questions_evidence
                    if qe.topic_id == tid and not qe.is_correct
                ]
                misconceptions.append(
                    DiagnosedMisconceptionItem(
                        topic_id=tid,
                        topic_code=t_code,
                        concept="Recursive Execution & Base Cases",
                        root_cause="Stack-Frame Execution Misunderstood",
                        description=(
                            "The student exhibits difficulty understanding how function calls are stacked in memory, "
                            "how local activation records unwind on return, and why base termination is essential."
                        ),
                        status="Hypothesis",
                        confidence=0.87 if is_repeated_pattern else 0.65,
                        prerequisite_gap_topic_id=prereq_id,
                        prerequisite_gap_topic_name=prereq_name,
                        supporting_evidence_ids=evidence_qids,
                        evidence_summary=(
                            f"{err_count} out of {tot_count} questions incorrect on {t_name}. "
                            f"Observed errors point to a likely prerequisite weakness in {prereq_name}."
                        )
                    )
                )
            elif is_repeated_pattern:
                # General repeated misconception hypothesis
                evidence_qids = [
                    qe.question_id for qe in evidence.questions_evidence
                    if qe.topic_id == tid and not qe.is_correct
                ]
                misconceptions.append(
                    DiagnosedMisconceptionItem(
                        topic_id=tid,
                        topic_code=t_code,
                        concept=f"{t_name} Core Concepts",
                        root_cause=f"Prerequisite gap in {prereq_name}",
                        description=f"Student struggles with fundamental operations and invariant properties of {t_name}.",
                        status="Hypothesis",
                        confidence=0.75,
                        prerequisite_gap_topic_id=prereq_id,
                        prerequisite_gap_topic_name=prereq_name,
                        supporting_evidence_ids=evidence_qids,
                        evidence_summary=f"{err_count}/{tot_count} questions incorrect on {t_name}."
                    )
                )

        summary = (
            f"Diagnosed {len(weak_topics)} topic area(s) needing attention with {len(misconceptions)} "
            f"root-cause misconception hypothesis(es). Teacher validation required."
        ) if weak_topics else "All evaluated topics meet passing mastery criteria."

        return DiagnosticReport(
            student_id=evidence.student_id,
            assessment_id=evidence.assessment_id,
            weak_topics=weak_topics,
            misconception_hypotheses=misconceptions,
            overall_diagnosis_summary=summary,
            requires_teacher_validation=bool(misconceptions)
        )
