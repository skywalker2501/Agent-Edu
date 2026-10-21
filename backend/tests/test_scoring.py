import pytest
from app.models.assessment import Question, QuestionType
from app.services.scoring_service import ScoringService
from app.services.sandbox_service import CodeSandboxService


@pytest.mark.asyncio
async def test_mcq_and_partial_credit_scoring():
    q1 = Question(
        id="q1",
        topic_id="top_rec",
        question_type=QuestionType.MULTIPLE_CHOICE,
        reference_answer="B"
    )
    q2 = Question(
        id="q2",
        topic_id="top_rec",
        question_type=QuestionType.MULTIPLE_SELECT,
        reference_answer='["A", "C"]'
    )
    questions_map = {"q1": q1, "q2": q2}
    points_map = {"q1": 10.0, "q2": 10.0}

    # Case A: Correct MCQ, partial correct multiple-select
    answers_payload = [
        {"question_id": "q1", "student_answer": "B"},
        {"question_id": "q2", "student_answer": '["A"]'}  # 1 out of 2 selected
    ]

    graded, total_score, max_score, breakdown = await ScoringService.grade_submission(
        questions_map=questions_map,
        answers_payload=answers_payload,
        points_map=points_map
    )

    assert total_score == 15.0  # 10 + 5 (partial credit)
    assert max_score == 20.0
    assert graded[0]["is_correct"] is True
    assert graded[1]["is_correct"] is False
    assert graded[1]["score_awarded"] == 5.0
    assert breakdown["top_rec"]["percentage"] == 75.0


@pytest.mark.asyncio
async def test_sandbox_python_execution():
    test_cases = [
        {"input": '"cat"', "expected_output": "tac"},
        {"input": '""', "expected_output": ""}
    ]
    student_code = (
        "def reverse_string(s):\n"
        "    if len(s) <= 1: return s\n"
        "    return reverse_string(s[1:]) + s[0]\n"
    )

    res = await CodeSandboxService.run_python_tests(student_code, test_cases)
    assert res.passed is True
    assert res.tests_passed == 2
    assert res.tests_total == 2
