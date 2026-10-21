from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class ObservedQuestionEvidence(BaseModel):
    question_id: str
    topic_id: Optional[str] = None
    concept_id: Optional[str] = None
    student_answer: str
    is_correct: bool
    score_awarded: float
    max_score: float
    feedback: Optional[str] = None
    execution_results: Optional[Dict[str, Any]] = None


class ObservationEvidence(BaseModel):
    student_id: str
    assessment_id: str
    submission_id: str
    total_score: float
    max_score: float
    percentage: float
    passed: bool
    topic_breakdown: Dict[str, Dict[str, float]]
    questions_evidence: List[ObservedQuestionEvidence]
    incorrect_topics: List[str]
    observed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class LearningObserverAgent:
    """
    Agent 1: Learning Observer
    Collects, sanitizes, and structures evidence from student assessment attempts,
    error patterns, topic performance, and interaction timing.
    Does not infer internal emotional states; focuses on objective learning evidence.
    """

    @classmethod
    def observe_submission(
        cls,
        student_id: str,
        assessment_id: str,
        submission_id: str,
        total_score: float,
        max_score: float,
        percentage: float,
        passed: bool,
        topic_breakdown: Dict[str, Dict[str, float]],
        graded_answers: List[Dict[str, Any]],
        questions_map: Dict[str, Any]
    ) -> ObservationEvidence:
        questions_evidence = []
        incorrect_topics_set = set()

        for ans in graded_answers:
            qid = ans["question_id"]
            q = questions_map.get(qid)
            is_correct = ans.get("is_correct", False)
            topic_id = q.topic_id if q else None
            concept_id = q.concept_id if q else None

            if not is_correct and topic_id:
                incorrect_topics_set.add(topic_id)

            questions_evidence.append(
                ObservedQuestionEvidence(
                    question_id=qid,
                    topic_id=topic_id,
                    concept_id=concept_id,
                    student_answer=str(ans.get("student_answer", "")),
                    is_correct=is_correct,
                    score_awarded=ans.get("score_awarded", 0.0),
                    max_score=ans.get("max_score", 10.0),
                    feedback=ans.get("automated_feedback"),
                    execution_results=ans.get("execution_results")
                )
            )

        return ObservationEvidence(
            student_id=student_id,
            assessment_id=assessment_id,
            submission_id=submission_id,
            total_score=total_score,
            max_score=max_score,
            percentage=percentage,
            passed=passed,
            topic_breakdown=topic_breakdown,
            questions_evidence=questions_evidence,
            incorrect_topics=list(incorrect_topics_set)
        )
