import pytest
from app.agents.observer_agent import LearningObserverAgent
from app.agents.diagnostic_agent import CognitiveDiagnosticAgent
from app.agents.learner_model_agent import LearnerModelAgent
from app.agents.intervention_planner_agent import InterventionPlannerAgent
from app.agents.governance_agent import GovernanceAgent
from app.agents.outcome_agent import OutcomeAgent
from app.models.learner import MasteryStatus


def test_agent1_observer():
    evidence = LearningObserverAgent.observe_submission(
        student_id="s123",
        assessment_id="a123",
        submission_id="sub123",
        total_score=12.0,
        max_score=30.0,
        percentage=40.0,
        passed=False,
        topic_breakdown={"rec": {"score": 12.0, "max": 30.0, "percentage": 40.0}},
        graded_answers=[
            {"question_id": "q1", "student_answer": "A", "is_correct": False, "score_awarded": 0.0, "max_score": 10.0},
            {"question_id": "q2", "student_answer": "B", "is_correct": True, "score_awarded": 10.0, "max_score": 10.0},
            {"question_id": "q3", "student_answer": "code", "is_correct": False, "score_awarded": 2.0, "max_score": 10.0}
        ],
        questions_map={}
    )
    assert evidence.student_id == "s123"
    assert evidence.percentage == 40.0
    assert len(evidence.questions_evidence) == 3


def test_agent2_diagnostic_does_not_overreact_to_single_mistake():
    class MockTopic:
        def __init__(self, code, name):
            self.code = code
            self.name = name

    evidence = LearningObserverAgent.observe_submission(
        student_id="s123",
        assessment_id="a123",
        submission_id="sub123",
        total_score=12.0,
        max_score=30.0,
        percentage=40.0,
        passed=False,
        topic_breakdown={"rec_id": {"score": 12.0, "max": 30.0, "percentage": 40.0}},
        graded_answers=[
            {"question_id": "q1", "student_answer": "A", "is_correct": False, "score_awarded": 0.0, "max_score": 10.0},
            {"question_id": "q2", "student_answer": "A", "is_correct": False, "score_awarded": 0.0, "max_score": 10.0}
        ],
        questions_map={"q1": type("Q", (), {"topic_id": "rec_id", "concept_id": None})(),
                       "q2": type("Q", (), {"topic_id": "rec_id", "concept_id": None})()}
    )

    report = CognitiveDiagnosticAgent.diagnose(
        evidence=evidence,
        topics_by_id={"rec_id": MockTopic("recursion", "Recursion")},
        topic_prerequisites_map={}
    )

    assert "rec_id" in report.weak_topics
    assert len(report.misconception_hypotheses) == 1
    # Status must be Hypothesis, not permanently confirmed!
    assert report.misconception_hypotheses[0].status == "Hypothesis"
    assert "Stack-Frame" in report.misconception_hypotheses[0].root_cause


def test_agent3_learner_model_transparent_formula():
    # Baseline update
    res1 = LearnerModelAgent.calculate_topic_mastery(
        prior_mastery=None,
        prior_count=0,
        observed_score=40.0,
        submission_id="sub1"
    )
    assert res1.new_mastery == 40.0
    assert res1.new_status == MasteryStatus.NEEDS_ATTENTION
    assert res1.assessment_count == 1

    # Follow-up update with score 80%
    res2 = LearnerModelAgent.calculate_topic_mastery(
        prior_mastery=40.0,
        prior_count=1,
        observed_score=80.0,
        submission_id="sub2"
    )
    # alpha = 1 / 2 = 0.5 -> 0.5 * 80 + 0.5 * 40 = 60.0%
    assert res2.new_mastery == 60.0
    assert res2.new_status == MasteryStatus.DEVELOPING
    assert res2.assessment_count == 2


def test_agent4_intervention_planner_and_simulator():
    plan = InterventionPlannerAgent.plan_interventions(
        student_id="s123",
        target_concept="Recursive Execution",
        target_topic_id="top_rec",
        target_topic_name="Recursion",
        root_cause="Stack-Frame Misconception",
        prerequisite_name="Stack Activation Records",
        learner_mastery=40.0
    )
    assert len(plan.candidates) >= 4
    # All candidates must have positive explainable ranking scores
    assert all(c.ranking_score > 0 for c in plan.candidates)
    assert plan.candidates[0].is_recommended is True


def test_agent5_governance_blocks_unauthorized_delivery():
    decision = GovernanceAgent.evaluate_intervention_proposal(
        target_concept="Recursion",
        strategy="worked_example",
        confidence=0.88,
        evidence_list=["Diagnostic score 40%"],
        expected_goal="Remediate stack frame confusion",
        is_teacher_approved=False
    )
    # Must require teacher approval
    assert decision.teacher_approval_required is True
    assert decision.is_approved_for_delivery is False
    assert "explanation_object" in decision.model_dump()


def test_agent6_outcome_agent():
    outcome = OutcomeAgent.evaluate_outcome(
        baseline_score=40.0,
        post_score=78.0,
        target_concept="Recursion",
        target_topic_name="Recursion",
        topic_mastery_before=40.0,
        topic_mastery_after=78.0
    )
    assert outcome.score_difference == 38.0
    assert outcome.is_improved is True
    assert outcome.objective_met is True
    assert "scientific_disclaimer" in outcome.model_dump()
