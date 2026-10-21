from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class OutcomeAnalysis(BaseModel):
    baseline_score: float
    post_score: float
    score_difference: float
    is_improved: bool
    objective_met: bool
    performance_change_summary: str
    remaining_weaknesses: List[str] = []
    next_action_recommendation: str
    scientific_disclaimer: str = (
        "Observed score changes reflect measured performance differences on assessment tasks. "
        "They do not constitute definitive proof of singular causality by the intervention alone."
    )


class OutcomeAgent:
    """
    Agent 6: Outcome Agent
    Measures post-intervention reassessment outcomes, calculates delta performance,
    evaluates objective attainment, and formulates the next-step recommendation.
    """

    @classmethod
    def evaluate_outcome(
        cls,
        baseline_score: float,
        post_score: float,
        target_concept: str,
        target_topic_name: str,
        topic_mastery_before: float,
        topic_mastery_after: float,
        remaining_errors: Optional[List[Dict[str, Any]]] = None
    ) -> OutcomeAnalysis:
        remaining_errors = remaining_errors or []
        score_diff = round(post_score - baseline_score, 1)
        is_improved = score_diff > 0
        objective_met = post_score >= 70.0

        if objective_met and is_improved:
            summary = (
                f"Significant positive performance change observed: Assessment score increased from "
                f"{baseline_score}% to {post_score}% (+{score_diff} points). Topic mastery progressed "
                f"from {topic_mastery_before}% to {topic_mastery_after}%."
            )
            next_action = f"Promote to next curriculum stage: Independent practice & advanced {target_topic_name} exercises."
        elif is_improved:
            summary = (
                f"Moderate improvement observed: Score changed from {baseline_score}% to {post_score}% (+{score_diff} points), "
                f"though below the 70% mastery threshold. Reinforcement recommended."
            )
            next_action = f"Continue guided practice and assign targeted problem set for {target_concept}."
        else:
            summary = (
                f"No observed performance improvement: Score remained at {post_score}% (delta: {score_diff} points). "
                f"The student continues to experience difficulty with {target_concept}."
            )
            next_action = "Escalate to teacher review for alternative instructional strategy or 1-on-1 pedagogical review."

        remaining_weaknesses = [err.get("concept", target_concept) for err in remaining_errors]

        return OutcomeAnalysis(
            baseline_score=baseline_score,
            post_score=post_score,
            score_difference=score_diff,
            is_improved=is_improved,
            objective_met=objective_met,
            performance_change_summary=summary,
            remaining_weaknesses=remaining_weaknesses,
            next_action_recommendation=next_action
        )
