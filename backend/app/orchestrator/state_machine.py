import time
from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.ai_workflow import AIWorkflow, AIWorkflowStep, WorkflowStage, WorkflowStatus
from app.models.assessment import Submission, Assessment, AssessmentAttempt
from app.models.curriculum import Topic, TopicPrerequisite
from app.models.learner import LearnerState, Misconception, MisconceptionRelationship, LearningEvent, MisconceptionStatus
from app.models.intervention import (
    Intervention, InterventionCandidate, InterventionVersion,
    InterventionStatus, TeacherReviewStatus
)
from app.models.review import TeacherReview, MethodReviewOutcome
from app.models.audit import Notification
from app.agents import (
    LearningObserverAgent,
    CognitiveDiagnosticAgent,
    LearnerModelAgent,
    InterventionPlannerAgent,
    GovernanceAgent,
    OutcomeAgent
)
from app.services.ai_service import AIService
from app.core.exceptions import InvalidStateTransitionError
from app.core.logging_config import logger


VALID_TRANSITIONS = {
    WorkflowStage.OBSERVE: [WorkflowStage.DIAGNOSE, WorkflowStatus.FAILED],
    WorkflowStage.DIAGNOSE: [WorkflowStage.MODEL, WorkflowStatus.FAILED],
    WorkflowStage.MODEL: [WorkflowStage.SIMULATE, WorkflowStatus.COMPLETED, WorkflowStatus.FAILED],
    WorkflowStage.SIMULATE: [WorkflowStage.GOVERN, WorkflowStatus.FAILED],
    WorkflowStage.GOVERN: [WorkflowStage.INTERVENE, WorkflowStatus.FAILED],
    WorkflowStage.INTERVENE: [WorkflowStage.MEASURE, WorkflowStatus.FAILED],
    WorkflowStage.MEASURE: [WorkflowStage.LEARN, WorkflowStatus.FAILED],
    WorkflowStage.LEARN: [WorkflowStage.RE_PLAN, WorkflowStatus.FAILED],
    WorkflowStage.RE_PLAN: [WorkflowStatus.COMPLETED, WorkflowStage.OBSERVE, WorkflowStatus.FAILED]
}


class WorkflowOrchestrator:
    """
    Coordinates the 10-step closed-loop workflow:
    Observe -> Diagnose -> Model -> Simulate -> Govern -> Intervene -> Measure -> Learn -> Re-plan.
    """

    @classmethod
    async def process_submission_pipeline(
        cls,
        db: AsyncSession,
        submission_id: str
    ) -> AIWorkflow:
        """
        Runs Stage 1 (OBSERVE) through Stage 5 (GOVERN).
        Creates teacher review packet and intervention candidates.
        Pauses at INTERVENE / awaiting_teacher for human-in-the-loop governance.
        """
        # Load submission with attempt and answers
        stmt = select(Submission).where(Submission.id == submission_id)
        res = await db.execute(stmt)
        submission = res.scalar_one_or_none()
        if not submission:
            raise ValueError(f"Submission {submission_id} not found")

        # Load attempt
        stmt_attempt = select(AssessmentAttempt).where(AssessmentAttempt.id == submission.attempt_id)
        res_att = await db.execute(stmt_attempt)
        attempt = res_att.scalar_one_or_none()

        # Load assessment
        stmt_ass = select(Assessment).where(Assessment.id == submission.assessment_id)
        res_ass = await db.execute(stmt_ass)
        assessment = res_ass.scalar_one_or_none()

        # Load all topics and prerequisites
        topics_res = await db.execute(select(Topic))
        all_topics = topics_res.scalars().all()
        topics_by_id = {t.id: t for t in all_topics}

        prereqs_res = await db.execute(select(TopicPrerequisite))
        all_prereqs = prereqs_res.scalars().all()
        prereqs_map: Dict[str, List[Any]] = {}
        for p in all_prereqs:
            prereqs_map.setdefault(p.topic_id, []).append(p)

        # Create or retrieve AIWorkflow
        workflow = AIWorkflow(
            student_id=submission.student_id,
            assessment_id=submission.assessment_id,
            workflow_type="closed_loop_remediation",
            current_stage=WorkflowStage.OBSERVE,
            status=WorkflowStatus.IN_PROGRESS
        )
        db.add(workflow)
        await db.flush()

        step_counter = 1

        # -------------------------------------------------------------
        # STAGE 1: OBSERVE
        # -------------------------------------------------------------
        start_t = time.time()
        # Retrieve answers and questions map
        from app.models.assessment import SubmissionAnswer, Question
        ans_res = await db.execute(
            select(SubmissionAnswer).where(SubmissionAnswer.submission_id == submission.id)
        )
        answers = ans_res.scalars().all()

        qids = [a.question_id for a in answers]
        q_res = await db.execute(select(Question).where(Question.id.in_(qids)))
        questions = q_res.scalars().all()
        questions_map = {q.id: q} if len(questions) == 1 else {q.id: q for q in questions}

        # Retrieve grading result
        from app.models.assessment import GradingResult
        gr_res = await db.execute(select(GradingResult).where(GradingResult.submission_id == submission.id))
        grading = gr_res.scalar_one_or_none()

        answers_payload = [
            {
                "question_id": a.question_id,
                "student_answer": a.student_answer,
                "code_language": a.code_language,
                "is_correct": a.is_correct,
                "score_awarded": a.score_awarded,
                "max_score": a.max_score,
                "automated_feedback": a.automated_feedback,
                "execution_results": a.execution_results
            }
            for a in answers
        ]

        evidence = LearningObserverAgent.observe_submission(
            student_id=submission.student_id,
            assessment_id=submission.assessment_id,
            submission_id=submission.id,
            total_score=grading.total_score if grading else attempt.score,
            max_score=grading.max_score if grading else attempt.max_score,
            percentage=grading.percentage if grading else attempt.percentage,
            passed=grading.passed if grading else attempt.passed,
            topic_breakdown=grading.topic_breakdown if grading and grading.topic_breakdown else {},
            graded_answers=answers_payload,
            questions_map=questions_map
        )

        step_observe = AIWorkflowStep(
            workflow_id=workflow.id,
            agent_name="Learning Observer",
            stage_name=WorkflowStage.OBSERVE,
            step_order=step_counter,
            input_payload={"submission_id": submission.id, "attempt_id": attempt.id if attempt else None},
            output_payload=evidence.model_dump(mode="json"),
            status="completed",
            execution_time_ms=int((time.time() - start_t) * 1000)
        )
        db.add(step_observe)
        step_counter += 1

        # Also create initial TeacherReview record with AI preliminary analysis
        primary_q = questions[0] if questions else None
        primary_a = answers[0] if answers else None
        ai_method_eval = await AIService.analyze_submission_method(
            question_title=primary_q.title if primary_q else "Assessment Question",
            question_prompt=primary_q.prompt if primary_q else "",
            reference_answer=primary_q.reference_answer if primary_q else "",
            student_code_or_answer=primary_a.student_answer if primary_a else "",
            execution_results=primary_a.execution_results if primary_a else None
        )

        teacher_review = TeacherReview(
            submission_id=submission.id,
            teacher_id=None,
            status="pending",
            method_review_outcome=ai_method_eval.get("suggested_outcome", MethodReviewOutcome.REQUIRES_MANUAL_REVIEW),
            ai_evaluation=ai_method_eval,
            ai_suggested_marks=primary_a.score_awarded if primary_a else 0.0,
            is_alternative_accepted=ai_method_eval.get("is_valid_alternative", False)
        )
        db.add(teacher_review)

        # -------------------------------------------------------------
        # STAGE 2: DIAGNOSE
        # -------------------------------------------------------------
        start_t = time.time()
        workflow.current_stage = WorkflowStage.DIAGNOSE
        diagnostic_report = CognitiveDiagnosticAgent.diagnose(
            evidence=evidence,
            topics_by_id=topics_by_id,
            topic_prerequisites_map=prereqs_map
        )

        # Persist misconception hypotheses with status='Hypothesis'
        saved_misconceptions = []
        for mh in diagnostic_report.misconception_hypotheses:
            misc = Misconception(
                student_id=submission.student_id,
                topic_id=mh.topic_id,
                concept=mh.concept,
                root_cause=mh.root_cause,
                description=mh.description,
                status=mh.status,  # "Hypothesis"
                confidence=mh.confidence,
                evidence_summary=mh.evidence_summary,
                supporting_evidence=mh.supporting_evidence_ids
            )
            db.add(misc)
            await db.flush()
            saved_misconceptions.append(misc)

            # Link relationship edge if prerequisite topic exists
            if mh.prerequisite_gap_topic_id:
                edge = MisconceptionRelationship(
                    misconception_id=misc.id,
                    prerequisite_topic_id=mh.prerequisite_gap_topic_id,
                    strength=0.88,
                    explanation=f"Cognitive prerequisite gap: {mh.prerequisite_gap_topic_name}"
                )
                db.add(edge)

        step_diagnose = AIWorkflowStep(
            workflow_id=workflow.id,
            agent_name="Cognitive Diagnostic Agent",
            stage_name=WorkflowStage.DIAGNOSE,
            step_order=step_counter,
            input_payload={"weak_topics_count": len(diagnostic_report.weak_topics)},
            output_payload=diagnostic_report.model_dump(mode="json"),
            status="completed",
            execution_time_ms=int((time.time() - start_t) * 1000)
        )
        db.add(step_diagnose)
        step_counter += 1

        # -------------------------------------------------------------
        # STAGE 3: MODEL (Learner Digital Twin Update)
        # -------------------------------------------------------------
        start_t = time.time()
        workflow.current_stage = WorkflowStage.MODEL
        model_updates = []

        for tid, tdata in evidence.topic_breakdown.items():
            obs_pct = tdata.get("percentage", 0.0)
            
            # Fetch existing learner state
            stmt_ls = select(LearnerState).where(
                LearnerState.student_id == submission.student_id,
                LearnerState.topic_id == tid
            )
            res_ls = await db.execute(stmt_ls)
            lstate = res_ls.scalar_one_or_none()

            prior_mastery = lstate.mastery_score if lstate else None
            prior_count = lstate.assessment_count if lstate else 0

            calc_res = LearnerModelAgent.calculate_topic_mastery(
                prior_mastery=prior_mastery,
                prior_count=prior_count,
                observed_score=obs_pct,
                submission_id=submission.id
            )

            if not lstate:
                lstate = LearnerState(
                    student_id=submission.student_id,
                    topic_id=tid,
                    mastery_score=calc_res.new_mastery,
                    confidence=calc_res.confidence,
                    status=calc_res.new_status,
                    assessment_count=calc_res.assessment_count,
                    version=1,
                    evidence_references=[submission.id]
                )
                db.add(lstate)
            else:
                lstate.mastery_score = calc_res.new_mastery
                lstate.confidence = calc_res.confidence
                lstate.status = calc_res.new_status
                lstate.assessment_count = calc_res.assessment_count
                lstate.version += 1
                refs = list(lstate.evidence_references or [])
                refs.append(submission.id)
                lstate.evidence_references = refs

            model_updates.append(calc_res.model_dump(mode="json"))

        step_model = AIWorkflowStep(
            workflow_id=workflow.id,
            agent_name="Learner Model Agent",
            stage_name=WorkflowStage.MODEL,
            step_order=step_counter,
            input_payload={"topic_breakdown": evidence.topic_breakdown},
            output_payload={"updates": model_updates},
            status="completed",
            execution_time_ms=int((time.time() - start_t) * 1000)
        )
        db.add(step_model)
        step_counter += 1

        # -------------------------------------------------------------
        # STAGE 4: SIMULATE (Intervention Simulator)
        # -------------------------------------------------------------
        start_t = time.time()
        workflow.current_stage = WorkflowStage.SIMULATE

        # Pick primary focus topic
        fallback_tid = list(topics_by_id.keys())[0] if topics_by_id else "general"
        focus_topic_id = diagnostic_report.weak_topics[0] if diagnostic_report.weak_topics else (
            assessment.topic_id or fallback_tid
        )
        focus_topic = topics_by_id.get(focus_topic_id)
        focus_topic_name = focus_topic.name if focus_topic else "Computer Science Concepts"

        primary_misc = saved_misconceptions[0] if saved_misconceptions else None
        target_concept = primary_misc.concept if primary_misc else f"{focus_topic_name} Core Principles"
        root_cause = primary_misc.root_cause if primary_misc else "Foundational conceptual gap"
        prereqs = prereqs_map.get(focus_topic_id, [])
        prereq_obj = topics_by_id.get(prereqs[0].prerequisite_topic_id) if prereqs else None
        prereq_name = prereq_obj.name if prereq_obj else "Underlying Computational Foundations"

        planned = InterventionPlannerAgent.plan_interventions(
            student_id=submission.student_id,
            target_concept=target_concept,
            target_topic_id=focus_topic_id,
            target_topic_name=focus_topic_name,
            root_cause=root_cause,
            prerequisite_name=prereq_name,
            learner_mastery=evidence.percentage
        )

        # Create Intervention container
        intervention = Intervention(
            student_id=submission.student_id,
            target_concept=target_concept,
            target_topic_id=focus_topic_id,
            selected_strategy=planned.recommended_strategy,
            reason=f"Addressed root cause: '{root_cause}' in {focus_topic_name}.",
            confidence=0.88,
            expected_goal=f"Remediate {target_concept} and reinforce {prereq_name}.",
            status=InterventionStatus.PROPOSED,
            teacher_status=TeacherReviewStatus.PENDING_REVIEW,
            trigger_assessment_id=assessment.id
        )
        db.add(intervention)
        await db.flush()
        workflow.intervention_id = intervention.id

        # Save candidate alternatives
        for c in planned.candidates:
            cand = InterventionCandidate(
                intervention_id=intervention.id,
                strategy=c.strategy,
                title=c.title,
                intended_objective=c.intended_objective,
                reason=c.reason,
                supporting_evidence=c.supporting_evidence,
                estimated_effort_minutes=c.estimated_effort_minutes,
                difficulty=c.difficulty,
                expected_benefit_score=c.expected_benefit_score,
                uncertainty=c.uncertainty,
                ranking_score=c.ranking_score,
                is_recommended=c.is_recommended,
                content_preview=c.content_preview
            )
            db.add(cand)

        # Create initial Version 1 (AI proposal)
        v1 = InterventionVersion(
            intervention_id=intervention.id,
            version_num=1,
            title=planned.candidates[0].title if planned.candidates else "Targeted Remediation",
            strategy=planned.recommended_strategy,
            content={
                "overview": planned.candidates[0].reason if planned.candidates else "",
                "preview": planned.candidates[0].content_preview if planned.candidates else "",
                "steps": [
                    {"step_num": 1, "title": "Review Prerequisite Concepts", "type": "lesson"},
                    {"step_num": 2, "title": "Analyze Worked Example Trace", "type": "worked_example"},
                    {"step_num": 3, "title": "Complete Guided Practice Checks", "type": "practice"}
                ]
            },
            created_by_role="ai",
            change_notes="Initial AI proposed candidate from multi-factor simulator"
        )
        db.add(v1)

        step_simulate = AIWorkflowStep(
            workflow_id=workflow.id,
            agent_name="Intervention Planner & Simulator",
            stage_name=WorkflowStage.SIMULATE,
            step_order=step_counter,
            input_payload={"target_concept": target_concept, "root_cause": root_cause},
            output_payload=planned.model_dump(mode="json"),
            status="completed",
            execution_time_ms=int((time.time() - start_t) * 1000)
        )
        db.add(step_simulate)
        step_counter += 1

        # -------------------------------------------------------------
        # STAGE 5: GOVERN
        # -------------------------------------------------------------
        start_t = time.time()
        workflow.current_stage = WorkflowStage.GOVERN

        gov_decision = GovernanceAgent.evaluate_intervention_proposal(
            target_concept=target_concept,
            strategy=planned.recommended_strategy,
            confidence=0.88,
            evidence_list=[f"Assessment score: {evidence.percentage}%", f"Detected root cause: {root_cause}"],
            expected_goal=intervention.expected_goal,
            is_teacher_approved=False
        )

        step_govern = AIWorkflowStep(
            workflow_id=workflow.id,
            agent_name="Governance & Explainability Agent",
            stage_name=WorkflowStage.GOVERN,
            step_order=step_counter,
            input_payload={"strategy": planned.recommended_strategy},
            output_payload=gov_decision.model_dump(mode="json"),
            status="completed",
            execution_time_ms=int((time.time() - start_t) * 1000)
        )
        db.add(step_govern)
        step_counter += 1

        # Transition workflow to INTERVENE stage, awaiting teacher approval
        workflow.current_stage = WorkflowStage.INTERVENE
        workflow.status = WorkflowStatus.AWAITING_TEACHER

        # Notify teachers that review is required
        notif = Notification(
            user_id=submission.student_id,
            title="Assessment Graded & Diagnostic Analysis Ready",
            message=f"Your submission for {assessment.title} has been analyzed. Diagnostic findings are currently in teacher review.",
            notification_type="review_required",
            link_url=f"/student/assessments/{assessment.id}/result"
        )
        db.add(notif)

        # Log learning event
        event = LearningEvent(
            student_id=submission.student_id,
            event_type="assessment_pipeline_completed",
            payload={
                "submission_id": submission.id,
                "percentage": evidence.percentage,
                "misconceptions_flagged": len(saved_misconceptions),
                "intervention_id": intervention.id
            }
        )
        db.add(event)

        await db.commit()
        await db.refresh(workflow)
        return workflow

    @classmethod
    async def process_reassessment_outcome(
        cls,
        db: AsyncSession,
        intervention_id: str,
        reassessment_attempt_id: str
    ):
        """
        Executes STAGE 7 (MEASURE), STAGE 8 (LEARN), and STAGE 9 (RE_PLAN).
        Updates Learner Digital Twin using actual reassessment evidence.
        """
        from app.models.intervention import InterventionOutcome
        from app.models.assessment import AssessmentAttempt, GradingResult

        # Load intervention
        stmt_int = select(Intervention).where(Intervention.id == intervention_id)
        res_int = await db.execute(stmt_int)
        intervention = res_int.scalar_one_or_none()
        if not intervention:
            raise ValueError(f"Intervention {intervention_id} not found")

        # Load baseline attempt score
        baseline_score = 42.0  # default baseline if initial attempt not linked
        if intervention.trigger_assessment_id:
            stmt_base = select(AssessmentAttempt).where(
                AssessmentAttempt.student_id == intervention.student_id,
                AssessmentAttempt.assessment_id == intervention.trigger_assessment_id
            )
            res_base = await db.execute(stmt_base)
            base_att = res_base.scalar_one_or_none()
            if base_att:
                baseline_score = base_att.percentage

        # Load reassessment attempt
        stmt_re = select(AssessmentAttempt).where(AssessmentAttempt.id == reassessment_attempt_id)
        res_re = await db.execute(stmt_re)
        re_att = res_re.scalar_one_or_none()
        if not re_att:
            raise ValueError(f"Reassessment attempt {reassessment_attempt_id} not found")

        post_score = re_att.percentage

        # Fetch learner state before
        stmt_ls = select(LearnerState).where(
            LearnerState.student_id == intervention.student_id,
            LearnerState.topic_id == intervention.target_topic_id
        )
        res_ls = await db.execute(stmt_ls)
        lstate = res_ls.scalar_one_or_none()
        before_mastery = lstate.mastery_score if lstate else baseline_score

        # -------------------------------------------------------------
        # STAGE 7: MEASURE (Outcome Agent)
        # -------------------------------------------------------------
        # Calculate updated mastery using LearnerModelAgent
        update_res = LearnerModelAgent.calculate_topic_mastery(
            prior_mastery=before_mastery,
            prior_count=lstate.assessment_count if lstate else 1,
            observed_score=post_score,
            submission_id=reassessment_attempt_id
        )

        outcome_eval = OutcomeAgent.evaluate_outcome(
            baseline_score=baseline_score,
            post_score=post_score,
            target_concept=intervention.target_concept,
            target_topic_name=intervention.target_topic.name if intervention.target_topic else "Topic",
            topic_mastery_before=before_mastery,
            topic_mastery_after=update_res.new_mastery
        )

        # Save InterventionOutcome
        outcome = InterventionOutcome(
            intervention_id=intervention.id,
            student_id=intervention.student_id,
            baseline_score=baseline_score,
            post_score=post_score,
            score_difference=outcome_eval.score_difference,
            success=outcome_eval.is_improved,
            objective_met=outcome_eval.objective_met,
            topic_mastery_before={intervention.target_concept: before_mastery},
            topic_mastery_after={intervention.target_concept: update_res.new_mastery},
            remaining_misconceptions=outcome_eval.remaining_weaknesses,
            next_recommendation=outcome_eval.next_action_recommendation
        )
        db.add(outcome)

        # -------------------------------------------------------------
        # STAGE 8: LEARN (Update Digital Twin & Misconception Graph)
        # -------------------------------------------------------------
        if lstate:
            lstate.mastery_score = update_res.new_mastery
            lstate.status = update_res.new_status
            lstate.confidence = update_res.confidence
            lstate.assessment_count = update_res.assessment_count
            lstate.version += 1

        # If post score >= 75%, resolve associated misconception
        if post_score >= 75.0:
            stmt_misc = select(Misconception).where(
                Misconception.student_id == intervention.student_id,
                Misconception.topic_id == intervention.target_topic_id,
                Misconception.status.in_([MisconceptionStatus.HYPOTHESIS, MisconceptionStatus.TEACHER_CONFIRMED])
            )
            res_misc = await db.execute(stmt_misc)
            misc = res_misc.scalar_one_or_none()
            if misc:
                misc.status = MisconceptionStatus.RESOLVED

        # Update intervention state
        intervention.status = InterventionStatus.COMPLETED
        intervention.reassessment_id = re_att.assessment_id

        # -------------------------------------------------------------
        # STAGE 9: RE_PLAN
        # -------------------------------------------------------------
        notif = Notification(
            user_id=intervention.student_id,
            title="Reassessment Complete & Mastery Updated! 🎉",
            message=(
                f"Your performance improved from {baseline_score}% to {post_score}% "
                f"(+{outcome_eval.score_difference} pts). Next recommended step: {outcome_eval.next_action_recommendation}"
            ),
            notification_type="achievement",
            link_url=f"/student/interventions/{intervention.id}/player"
        )
        db.add(notif)

        await db.commit()
        return outcome
