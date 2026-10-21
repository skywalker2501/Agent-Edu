import json
from typing import Dict, Any, List, Tuple
from app.models.assessment import Question, QuestionType, SubmissionAnswer
from app.services.sandbox_service import CodeSandboxService
from app.core.logging_config import logger


class ScoringService:
    """
    Objective server-side assessment scoring engine.
    Calculates points, partial credit, and topic breakdowns.
    Never trusts client-reported scores!
    """

    @classmethod
    async def grade_submission(
        cls,
        questions_map: Dict[str, Question],
        answers_payload: List[Dict[str, Any]],
        points_map: Dict[str, float]
    ) -> Tuple[List[Dict[str, Any]], float, float, Dict[str, Any]]:
        """
        Grades a student's submission answers against canonical question criteria.
        Returns:
            - graded_answers_data: list of dicts to populate SubmissionAnswer
            - total_score: float
            - max_score: float
            - topic_breakdown: Dict of per-topic performance
        """
        total_score = 0.0
        max_score = 0.0
        topic_scores: Dict[str, Dict[str, float]] = {}  # topic_id -> {"score": float, "max": float}
        graded_answers = []

        for item in answers_payload:
            qid = item.get("question_id")
            raw_answer = str(item.get("student_answer", "")).strip()
            code_lang = item.get("code_language")

            question = questions_map.get(qid)
            if not question:
                continue

            q_points = points_map.get(qid, 10.0)
            max_score += q_points

            topic_id = question.topic_id or "general"
            if topic_id not in topic_scores:
                topic_scores[topic_id] = {"score": 0.0, "max": 0.0}
            topic_scores[topic_id]["max"] += q_points

            is_correct = False
            score_awarded = 0.0
            feedback = ""
            exec_results = None

            q_type = question.question_type

            if q_type == QuestionType.MULTIPLE_CHOICE:
                ref = (question.reference_answer or "").strip()
                is_correct = (raw_answer.upper() == ref.upper())
                score_awarded = q_points if is_correct else 0.0
                feedback = "Correct selection" if is_correct else f"Incorrect. The correct option was {ref}."

            elif q_type == QuestionType.MULTIPLE_SELECT:
                # Expecting comma separated or json array of selected options
                try:
                    student_choices = set(json.loads(raw_answer)) if raw_answer.startswith("[") else set(s.strip().upper() for s in raw_answer.split(","))
                except Exception:
                    student_choices = set(s.strip().upper() for s in raw_answer.split(","))

                ref_raw = question.reference_answer or ""
                try:
                    ref_choices = set(json.loads(ref_raw)) if ref_raw.startswith("[") else set(s.strip().upper() for s in ref_raw.split(","))
                except Exception:
                    ref_choices = set(s.strip().upper() for s in ref_raw.split(","))

                correct_selected = student_choices.intersection(ref_choices)
                wrong_selected = student_choices.difference(ref_choices)

                if ref_choices and not wrong_selected and len(correct_selected) == len(ref_choices):
                    is_correct = True
                    score_awarded = q_points
                    feedback = "All correct options selected."
                elif ref_choices and len(correct_selected) > 0 and len(wrong_selected) == 0:
                    # Partial credit
                    is_correct = False
                    ratio = len(correct_selected) / len(ref_choices)
                    score_awarded = round(q_points * ratio, 2)
                    feedback = f"Partially correct: selected {len(correct_selected)} of {len(ref_choices)} options."
                else:
                    is_correct = False
                    score_awarded = 0.0
                    feedback = "Incorrect options selected."

            elif q_type == QuestionType.SHORT_ANSWER:
                ref = (question.reference_answer or "").strip().lower()
                ans = raw_answer.strip().lower()
                if ref == ans:
                    is_correct = True
                    score_awarded = q_points
                    feedback = "Exact match with expected answer."
                elif ref in ans or ans in ref:
                    is_correct = False
                    score_awarded = round(q_points * 0.5, 2)  # 50% partial credit for conceptual match
                    feedback = "Partially correct response. Forwarded for teacher verification."
                else:
                    is_correct = False
                    score_awarded = 0.0
                    feedback = "Does not match expected answer."

            elif q_type == QuestionType.PROGRAMMING:
                test_cases = question.test_cases or []
                exec_results = await CodeSandboxService.evaluate_code(
                    code=raw_answer,
                    language=code_lang or "python",
                    test_cases=test_cases
                )
                
                passed_tests = exec_results.get("tests_passed", 0)
                total_tests = exec_results.get("tests_total", len(test_cases) or 1)

                if total_tests > 0 and passed_tests == total_tests:
                    is_correct = True
                    score_awarded = q_points
                    feedback = f"All {passed_tests}/{total_tests} test cases passed."
                elif total_tests > 0 and passed_tests > 0:
                    ratio = passed_tests / total_tests
                    score_awarded = round(q_points * ratio, 2)
                    is_correct = False
                    feedback = f"Partial passes: {passed_tests}/{total_tests} test cases passed."
                else:
                    is_correct = False
                    score_awarded = 0.0
                    feedback = exec_results.get("error") or "Failed test cases. Forwarded for teacher method review."

            total_score += score_awarded
            topic_scores[topic_id]["score"] += score_awarded

            graded_answers.append({
                "question_id": qid,
                "student_answer": raw_answer,
                "code_language": code_lang,
                "is_correct": is_correct,
                "score_awarded": score_awarded,
                "max_score": q_points,
                "automated_feedback": feedback,
                "execution_results": exec_results
            })

        # Calculate topic breakdown percentages
        topic_breakdown = {}
        for tid, data in topic_scores.items():
            t_score = data["score"]
            t_max = data["max"]
            pct = round((t_score / t_max * 100.0), 1) if t_max > 0 else 0.0
            topic_breakdown[tid] = {
                "score": t_score,
                "max": t_max,
                "percentage": pct
            }

        return graded_answers, round(total_score, 2), round(max_score, 2), topic_breakdown
