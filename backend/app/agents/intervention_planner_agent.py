from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from app.models.intervention import InterventionStrategy


class CandidatePlan(BaseModel):
    strategy: str
    title: str
    intended_objective: str
    reason: str
    supporting_evidence: List[str]
    estimated_effort_minutes: int
    difficulty: str
    expected_benefit_score: float  # 0.0 to 1.0
    uncertainty: float             # 0.0 to 1.0
    ranking_score: float           # 0.0 to 100.0 explainable score
    content_preview: str
    is_recommended: bool = False


class PlannedInterventions(BaseModel):
    student_id: str
    target_concept: str
    target_topic_id: str
    candidates: List[CandidatePlan]
    recommended_strategy: str
    explainable_ranking_weights: Dict[str, float]


class InterventionPlannerAgent:
    """
    Agent 4: Intervention Planner and Simulator
    Generates multiple candidate learning interventions for diagnosed misconceptions
    and ranks them using an explainable multi-factor scoring formula.
    
    Formula:
    Score = (w_root * root_relevance + w_prereq * prereq_relevance +
             w_benefit * expected_benefit + w_suitability * difficulty_suitability -
             w_effort * effort_penalty) * 100
    """

    DEFAULT_WEIGHTS = {
        "root_cause_relevance": 0.35,
        "prerequisite_relevance": 0.25,
        "expected_benefit": 0.20,
        "difficulty_suitability": 0.15,
        "effort_suitability": 0.05
    }

    @classmethod
    def plan_interventions(
        cls,
        student_id: str,
        target_concept: str,
        target_topic_id: str,
        target_topic_name: str,
        root_cause: str,
        prerequisite_name: Optional[str] = None,
        learner_mastery: float = 40.0,
        custom_weights: Optional[Dict[str, float]] = None
    ) -> PlannedInterventions:
        weights = custom_weights or cls.DEFAULT_WEIGHTS
        prereq = prerequisite_name or "Function Call Activation Stack"

        # Generate the standard suite of alternatives for the diagnosed need
        is_recursion = "recursion" in target_topic_name.lower() or "recursion" in target_concept.lower()

        candidates_raw = [
            {
                "strategy": InterventionStrategy.PREREQUISITE_LESSON,
                "title": f"Foundational Lesson: {prereq}",
                "intended_objective": f"Master prerequisite concepts in {prereq} before attempting complex problems.",
                "reason": f"Directly addresses root cause: '{root_cause}' by reinforcing prerequisite foundations.",
                "supporting_evidence": [
                    f"Student mastery in {target_topic_name} is currently {learner_mastery}%.",
                    f"Misconception root-cause points to weakness in {prereq}."
                ],
                "estimated_effort_minutes": 20,
                "difficulty": "beginner",
                "root_relevance": 0.95,
                "prereq_relevance": 1.00,
                "expected_benefit": 0.90,
                "difficulty_suitability": 0.85,
                "effort_penalty": 0.20,
                "uncertainty": 0.12,
                "content_preview": (
                    f"### Prerequisite Primer: {prereq}\n\n"
                    "Before a recursive call can return, the operating environment must maintain a stack frame. "
                    "In this module, you will learn how local parameters, return addresses, and stack memory work."
                )
            },
            {
                "strategy": InterventionStrategy.WORKED_EXAMPLE,
                "title": f"Step-by-Step Worked Example: {target_concept}",
                "intended_objective": "Observe expert step-by-step problem decomposition and stack-frame trace.",
                "reason": "Provides cognitive modeling of recursive call stack push and pop operations.",
                "supporting_evidence": [
                    "Allows learner to compare their incorrect trace against canonical execution."
                ],
                "estimated_effort_minutes": 12,
                "difficulty": "intermediate",
                "root_relevance": 0.90,
                "prereq_relevance": 0.80,
                "expected_benefit": 0.88,
                "difficulty_suitability": 0.90,
                "effort_penalty": 0.12,
                "uncertainty": 0.15,
                "content_preview": (
                    "### Worked Example: Tracing `reverseString(\"cat\")`\n\n"
                    "1. Call 1: `reverseString(\"cat\")` calls `reverseString(\"at\") + 'c'`\n"
                    "2. Call 2: `reverseString(\"at\")` calls `reverseString(\"t\") + 'a'`\n"
                    "3. Call 3: Base case reached: `\"t\"` returns immediately.\n"
                    "4. Call 2 unwinds: `\"t\" + 'a' = \"ta\"`\n"
                    "5. Call 1 unwinds: `\"ta\" + 'c' = \"tac\"`"
                )
            },
            {
                "strategy": InterventionStrategy.INTERACTIVE_VISUALIZATION,
                "title": f"Interactive Call-Stack Visualizer: {target_concept}",
                "intended_objective": "Visually manipulate the call stack to see frame push, local memory, and pop unwinding.",
                "reason": "Dynamic visual representation bridges the gap between abstract code and concrete execution memory.",
                "supporting_evidence": [
                    "Students with mental model errors benefit significantly from visual state inspection."
                ],
                "estimated_effort_minutes": 15,
                "difficulty": "intermediate",
                "root_relevance": 0.92,
                "prereq_relevance": 0.85,
                "expected_benefit": 0.89,
                "difficulty_suitability": 0.90,
                "effort_penalty": 0.15,
                "uncertainty": 0.14,
                "content_preview": (
                    "Interactive simulation showing stack pointer movement, activation records, and return values in real time."
                )
            },
            {
                "strategy": InterventionStrategy.GUIDED_PRACTICE,
                "title": f"Scaffolded Guided Practice: {target_concept}",
                "intended_objective": "Apply recursive reasoning with progressive hints and immediate feedback.",
                "reason": "Transitions student from passive comprehension to active application.",
                "supporting_evidence": [
                    "Learner attempted coding question but missed base termination condition."
                ],
                "estimated_effort_minutes": 15,
                "difficulty": "intermediate",
                "root_relevance": 0.82,
                "prereq_relevance": 0.70,
                "expected_benefit": 0.82,
                "difficulty_suitability": 0.80,
                "effort_penalty": 0.15,
                "uncertainty": 0.20,
                "content_preview": (
                    "Interactive coding prompt with automated scaffolding: Complete the base condition first, then fill in the recursive return statement."
                )
            },
            {
                "strategy": InterventionStrategy.SOCRATIC_TUTORING,
                "title": f"Socratic AI Tutoring Session: {target_concept}",
                "intended_objective": "Interactive dialogue uncovering misconceptions through targeted questioning.",
                "reason": "Provides dynamic individualized guidance and helps student articulate why errors occur.",
                "supporting_evidence": [
                    "Tutor adapts explanations based on student's specific responses."
                ],
                "estimated_effort_minutes": 10,
                "difficulty": "intermediate",
                "root_relevance": 0.85,
                "prereq_relevance": 0.75,
                "expected_benefit": 0.85,
                "difficulty_suitability": 0.85,
                "effort_penalty": 0.10,
                "uncertainty": 0.18,
                "content_preview": (
                    "Conversation initiated in 'Explain & Hint' mode. Focus: 'What happens to local variables when a recursive call returns?'"
                )
            }
        ]

        scored_candidates: List[CandidatePlan] = []
        for c in candidates_raw:
            score = (
                (weights["root_cause_relevance"] * c["root_relevance"]) +
                (weights["prerequisite_relevance"] * c["prereq_relevance"]) +
                (weights["expected_benefit"] * c["expected_benefit"]) +
                (weights["difficulty_suitability"] * c["difficulty_suitability"]) -
                (weights["effort_suitability"] * c["effort_penalty"])
            ) * 100.0

            scored_candidates.append(
                CandidatePlan(
                    strategy=c["strategy"],
                    title=c["title"],
                    intended_objective=c["intended_objective"],
                    reason=c["reason"],
                    supporting_evidence=c["supporting_evidence"],
                    estimated_effort_minutes=c["estimated_effort_minutes"],
                    difficulty=c["difficulty"],
                    expected_benefit_score=c["expected_benefit"],
                    uncertainty=c["uncertainty"],
                    ranking_score=round(score, 1),
                    content_preview=c["content_preview"]
                )
            )

        # Sort descending by ranking_score
        scored_candidates.sort(key=lambda x: x.ranking_score, reverse=True)
        if scored_candidates:
            scored_candidates[0].is_recommended = True

        recommended_strategy = scored_candidates[0].strategy if scored_candidates else InterventionStrategy.WORKED_EXAMPLE

        return PlannedInterventions(
            student_id=student_id,
            target_concept=target_concept,
            target_topic_id=target_topic_id,
            candidates=scored_candidates,
            recommended_strategy=recommended_strategy,
            explainable_ranking_weights=weights
        )
