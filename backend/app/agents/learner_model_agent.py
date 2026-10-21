from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.models.learner import MasteryStatus


class MasteryUpdateResult(BaseModel):
    topic_id: str
    old_mastery: float
    new_mastery: float
    old_status: str
    new_status: str
    confidence: float
    assessment_count: int
    formula_used: str


class LearnerModelAgent:
    """
    Agent 3: Learner Model Agent (Learner Digital Twin)
    Maintains the persistent, versioned representation of the student's cognitive state.
    
    Transparent Calculation Rules:
    - Mastered: score >= 80%
    - Developing: 60% <= score < 80%
    - Needs Attention: 0 < score < 60%
    - Not Started: 0 attempts
    
    Update Formula:
    M_new = alpha * observed_score + (1 - alpha) * M_prior
    where alpha = 1.0 / min(prior_count + 1, 3)
    Confidence = min(0.50 + (0.15 * count), 0.95)
    """

    @classmethod
    def calculate_topic_mastery(
        cls,
        prior_mastery: Optional[float],
        prior_count: int,
        observed_score: float,
        submission_id: str
    ) -> MasteryUpdateResult:
        if prior_mastery is None or prior_count == 0:
            new_mastery = round(observed_score, 1)
            new_count = 1
            formula = f"Initial assessment baseline: {observed_score}%"
        else:
            alpha = round(1.0 / min(prior_count + 1, 3), 2)
            new_mastery = round((alpha * observed_score) + ((1.0 - alpha) * prior_mastery), 1)
            new_count = prior_count + 1
            formula = f"Adaptive Bayesian EMA: ({alpha} * {observed_score}) + ({round(1.0 - alpha, 2)} * {prior_mastery})"

        # Status mapping
        if new_mastery >= 80.0:
            status = MasteryStatus.MASTERED
        elif new_mastery >= 60.0:
            status = MasteryStatus.DEVELOPING
        elif new_mastery > 0.0:
            status = MasteryStatus.NEEDS_ATTENTION
        else:
            status = MasteryStatus.NOT_STARTED

        confidence = round(min(0.50 + (0.15 * new_count), 0.95), 2)

        return MasteryUpdateResult(
            topic_id="",  # set by caller
            old_mastery=prior_mastery or 0.0,
            new_mastery=new_mastery,
            old_status=MasteryStatus.NOT_STARTED if prior_mastery is None else (
                MasteryStatus.MASTERED if prior_mastery >= 80 else (
                    MasteryStatus.DEVELOPING if prior_mastery >= 60 else MasteryStatus.NEEDS_ATTENTION
                )
            ),
            new_status=status,
            confidence=confidence,
            assessment_count=new_count,
            formula_used=formula
        )
