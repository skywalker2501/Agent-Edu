from typing import Dict, Any, List, Optional
from app.services.ai_service import AIService
from app.agents.intervention_planner_agent import InterventionPlannerAgent
from app.schemas.review import MultiApproachSuggestionResponse, SolutionApproachOption


class MultiApproachAndOutcomeEngine:
    """
    Implements the two connected features described in CEp ai.pdf:
    A. Multiple Solution Approach Suggester
       - Generates and evaluates alternative solution approaches (e.g. Two-pointer, StringBuilder, Recursion for Java String Reversal)
       - Evaluates time/space complexity, constraints, and test results
    B. Multiple Learning Outcome & Intervention Suggester
       - Suggests alternative pedagogical next steps based on demonstrated knowledge
    """

    @classmethod
    async def suggest_solution_approaches(
        cls,
        question_id: str,
        question_title: str,
        question_prompt: str,
        student_submission: Optional[str] = None
    ) -> MultiApproachSuggestionResponse:
        raw_approaches = await AIService.generate_solution_approaches(
            question_title=question_title,
            question_prompt=question_prompt,
            student_submission=student_submission
        )

        approaches = [SolutionApproachOption(**a) for a in raw_approaches]

        return MultiApproachSuggestionResponse(
            question_id=question_id,
            question_title=question_title,
            question_prompt=question_prompt,
            student_submission_snippet=student_submission[:200] if student_submission else None,
            approaches=approaches,
            ai_recommendation_reason=(
                "Multiple valid solution paths generated across algorithmic paradigms. "
                "Teachers can accept alternative valid solutions, compare complexities, and award credit."
            )
        )

    @classmethod
    def suggest_learning_outcomes(
        cls,
        student_id: str,
        target_concept: str,
        target_topic_id: str,
        target_topic_name: str,
        root_cause: str,
        prerequisite_name: Optional[str] = None,
        learner_mastery: float = 40.0
    ):
        return InterventionPlannerAgent.plan_interventions(
            student_id=student_id,
            target_concept=target_concept,
            target_topic_id=target_topic_id,
            target_topic_name=target_topic_name,
            root_cause=root_cause,
            prerequisite_name=prerequisite_name,
            learner_mastery=learner_mastery
        )
