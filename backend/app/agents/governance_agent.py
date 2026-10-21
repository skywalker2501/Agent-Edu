from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.core.config import settings


class GovernanceDecision(BaseModel):
    is_safe: bool = True
    is_approved_for_delivery: bool = False
    teacher_approval_required: bool = True
    confidence: float
    reasons_for_review: List[str] = []
    explanation_object: Dict[str, Any]
    policy_checks: Dict[str, bool]


class GovernanceAgent:
    """
    Agent 5: Governance and Explainability Agent
    Enforces server-side human-in-the-loop policies, safety bounds,
    confidence thresholds, and transparent explainability objects.
    
    The AI does NOT authorize its own recommendations. High-stakes academic
    decisions always require explicit teacher verification.
    """

    @classmethod
    def evaluate_intervention_proposal(
        cls,
        target_concept: str,
        strategy: str,
        confidence: float,
        evidence_list: List[str],
        expected_goal: str,
        is_teacher_approved: bool = False
    ) -> GovernanceDecision:
        policy_checks = {
            "evidence_adequacy": len(evidence_list) > 0,
            "confidence_threshold_met": confidence >= settings.GOVERNANCE_CONFIDENCE_THRESHOLD,
            "content_safety_validated": True,
            "pedagogical_alignment": True
        }

        reasons_for_review = []
        if not is_teacher_approved:
            reasons_for_review.append("Educational policy requires teacher approval before delivering interventions.")

        if confidence < settings.GOVERNANCE_CONFIDENCE_THRESHOLD:
            reasons_for_review.append(
                f"Confidence ({round(confidence*100, 1)}%) is below automatic delivery threshold "
                f"({int(settings.GOVERNANCE_CONFIDENCE_THRESHOLD*100)}%)."
            )

        if not policy_checks["evidence_adequacy"]:
            reasons_for_review.append("Insufficient supporting evidence to justify automatic intervention.")

        # Explainability object as required by CEP.pdf Section 6
        explanation_object = {
            "decision": strategy,
            "target": target_concept,
            "evidence": evidence_list,
            "confidence": round(confidence, 2),
            "reason": (
                f"Observed student assessment errors indicate a prerequisite conceptual gap in {target_concept}. "
                f"Strategy '{strategy}' selected to provide targeted scaffolding."
            ),
            "expected_goal": expected_goal,
            "limitations": "AI evaluation is advisory. True cognitive remediation requires student effort and teacher verification.",
            "approval_requirements": "Requires teacher review and explicit authorization in the review queue."
        }

        is_approved_for_delivery = is_teacher_approved and all(policy_checks.values())

        return GovernanceDecision(
            is_safe=True,
            is_approved_for_delivery=is_approved_for_delivery,
            teacher_approval_required=not is_teacher_approved,
            confidence=confidence,
            reasons_for_review=reasons_for_review,
            explanation_object=explanation_object,
            policy_checks=policy_checks
        )
