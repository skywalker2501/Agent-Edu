import asyncio
import os
import sys
from datetime import datetime, timezone, timedelta

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import AsyncSessionLocal, init_db
from app.core.security import get_password_hash
from app.models.user import User, UserRole
from app.models.classroom import Class, ClassMembership
from app.models.curriculum import Topic, Concept, TopicPrerequisite
from app.models.assessment import (
    Question, QuestionType, Assessment, AssessmentQuestion,
    AssessmentAttempt, Submission, SubmissionAnswer, GradingResult
)
from app.models.learner import (
    LearnerState, MasteryStatus, Misconception, MisconceptionStatus,
    MisconceptionRelationship, LearningEvent
)
from app.models.intervention import (
    Intervention, InterventionStrategy, InterventionStatus,
    TeacherReviewStatus, InterventionCandidate, InterventionVersion,
    InterventionOutcome
)
from app.models.review import TeacherReview, MethodReviewOutcome, TeacherDecision
from app.models.ai_workflow import AIWorkflow, AIWorkflowStep, WorkflowStatus, WorkflowStage
from app.models.audit import Notification, LearningResource, AuditEvent


async def seed_database():
    print("🌱 Initializing database schema...")
    await init_db()

    async with AsyncSessionLocal() as db:
        print("👤 Creating demo users...")
        # 1. Users
        admin_user = User(
            email="admin@agentedu.org",
            full_name="Dr. Eleanor Vance (Admin)",
            role=UserRole.ADMIN,
            hashed_password=get_password_hash("AdminPass123!")
        )
        teacher_user = User(
            email="teacher@agentedu.org",
            full_name="Prof. Alan Turing",
            role=UserRole.TEACHER,
            hashed_password=get_password_hash("TeacherPass123!")
        )
        student_rahul = User(
            email="rahul@agentedu.org",
            full_name="Rahul Gupta",
            role=UserRole.STUDENT,
            hashed_password=get_password_hash("StudentPass123!")
        )
        student_priya = User(
            email="priya@agentedu.org",
            full_name="Priya Singh",
            role=UserRole.STUDENT,
            hashed_password=get_password_hash("StudentPass123!")
        )
        db.add_all([admin_user, teacher_user, student_rahul, student_priya])
        await db.flush()

        print("📚 Creating topics, concepts, and prerequisite ontology...")
        # 2. Topics & Prerequisites
        topic_arrays = Topic(
            code="arrays",
            name="Arrays & Dynamic Lists",
            category="Data Structures",
            description="Sequential contiguous memory allocations, indexing, and linear traversal.",
            order_index=1
        )
        topic_stacks = Topic(
            code="stacks",
            name="Stacks & Call Frames",
            category="Computer Systems & Memory",
            description="LIFO data structures, execution stack frames, activation records, and call returns.",
            order_index=2
        )
        topic_linked_lists = Topic(
            code="linked_lists",
            name="Linked Lists",
            category="Data Structures",
            description="Pointer/reference chains, node insertion, and pointer manipulation.",
            order_index=3
        )
        topic_recursion = Topic(
            code="recursion",
            name="Recursion & Divide-and-Conquer",
            category="Algorithms",
            description="Self-referential functions, base cases, recurrence relations, and recursive tree execution.",
            order_index=4
        )
        topic_sorting = Topic(
            code="sorting",
            name="Sorting Algorithms",
            category="Algorithms",
            description="Merge sort, Quick sort, and comparison-based sorting.",
            order_index=5
        )
        topic_searching = Topic(
            code="searching",
            name="Searching & Binary Search",
            category="Algorithms",
            description="Linear and logarithmic search over ordered spaces.",
            order_index=6
        )
        db.add_all([topic_arrays, topic_stacks, topic_linked_lists, topic_recursion, topic_sorting, topic_searching])
        await db.flush()

        # Prerequisite: Stacks & Call Frames is a hard prerequisite for Recursion!
        prereq_link = TopicPrerequisite(
            topic_id=topic_recursion.id,
            prerequisite_topic_id=topic_stacks.id,
            relationship_type="hard_prerequisite",
            strength=0.95,
            explanation="Understanding activation records and memory call stacks is essential to comprehend recursive unwinding."
        )
        db.add(prereq_link)

        # Concepts
        c_base_case = Concept(
            topic_id=topic_recursion.id,
            code="recursion_base_case",
            name="Base Termination Conditions",
            description="Halting criterion preventing infinite recursive loops.",
            difficulty_level="beginner"
        )
        c_stack_frames = Concept(
            topic_id=topic_stacks.id,
            code="stack_activation_records",
            name="Call Stack Activation Records",
            description="Allocation of local parameter state on function invocation.",
            difficulty_level="intermediate"
        )
        db.add_all([c_base_case, c_stack_frames])
        await db.flush()

        print("🏫 Creating classes and enrollments...")
        # 3. Class
        cs102 = Class(
            name="CS102: Data Structures & Algorithms",
            code="CS102-FALL",
            description="Foundations of linear and non-linear data structures, algorithmic paradigms, and memory analysis.",
            teacher_id=teacher_user.id
        )
        db.add(cs102)
        await db.flush()

        db.add(ClassMembership(class_id=cs102.id, student_id=student_rahul.id, status="active"))
        db.add(ClassMembership(class_id=cs102.id, student_id=student_priya.id, status="active"))
        await db.flush()

        print("❓ Creating assessment questions and assessments...")
        # 4. Questions
        q_rec_trace = Question(
            topic_id=topic_recursion.id,
            concept_id=c_base_case.id,
            title="Recursive Factorial Call Stack Execution",
            prompt="What is the maximum number of activation records on the call stack when evaluating `factorial(4)`?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            options=[
                {"id": "A", "text": "3 frames"},
                {"id": "B", "text": "4 frames"},
                {"id": "C", "text": "5 frames (including initial and base case n=0/1)"},
                {"id": "D", "text": "1 frame (reused in place)"}
            ],
            reference_answer="C",
            difficulty="intermediate",
            created_by=teacher_user.id
        )
        q_rec_base = Question(
            topic_id=topic_recursion.id,
            concept_id=c_base_case.id,
            title="Base Case Identification",
            prompt="Which condition correctly guards against infinite recursion in a binary tree traversal?",
            question_type=QuestionType.MULTIPLE_CHOICE,
            options=[
                {"id": "A", "text": "if (node == null) return;"},
                {"id": "B", "text": "while (node != null)"},
                {"id": "C", "text": "node = node.left"},
                {"id": "D", "text": "return node.val"}
            ],
            reference_answer="A",
            difficulty="beginner",
            created_by=teacher_user.id
        )
        q_str_reverse = Question(
            topic_id=topic_recursion.id,
            concept_id=c_base_case.id,
            title="String Reversal Algorithm",
            prompt=(
                "Implement a function `reverse_string(s)` that reverses an input string. "
                "Ensure edge cases such as empty or single-character strings are handled correctly."
            ),
            question_type=QuestionType.PROGRAMMING,
            reference_answer=(
                "# Canonical Iterative Solution\n"
                "def reverse_string(s):\n"
                "    return s[::-1]\n"
            ),
            constraints={"language": "python", "timeout_seconds": 2},
            test_cases=[
                {"input": '"hello"', "expected_output": "olleh", "is_hidden": False},
                {"input": '"a"', "expected_output": "a", "is_hidden": False},
                {"input": '""', "expected_output": "", "is_hidden": False}
            ],
            difficulty="intermediate",
            created_by=teacher_user.id
        )
        db.add_all([q_rec_trace, q_rec_base, q_str_reverse])
        await db.flush()

        # Initial Diagnostic Assessment
        diag_assessment = Assessment(
            title="CS102 Diagnostic: Recursion & Stack Memory",
            description="Initial diagnostic assessment to evaluate conceptual understanding of call stacks and recursive execution.",
            class_id=cs102.id,
            topic_id=topic_recursion.id,
            assessment_type="initial",
            time_limit_minutes=25,
            passing_score=60.0,
            is_active=True,
            created_by=teacher_user.id
        )
        db.add(diag_assessment)
        await db.flush()

        db.add(AssessmentQuestion(assessment_id=diag_assessment.id, question_id=q_rec_trace.id, points=10.0, order_index=1))
        db.add(AssessmentQuestion(assessment_id=diag_assessment.id, question_id=q_rec_base.id, points=10.0, order_index=2))
        db.add(AssessmentQuestion(assessment_id=diag_assessment.id, question_id=q_str_reverse.id, points=10.0, order_index=3))
        await db.flush()

        # Reassessment (linked to intervention)
        reassessment = Assessment(
            title="Reassessment: Recursive Execution & Call Stacks",
            description="Follow-up assessment to measure post-intervention performance delta.",
            class_id=cs102.id,
            topic_id=topic_recursion.id,
            assessment_type="reassessment",
            time_limit_minutes=20,
            passing_score=70.0,
            is_active=True,
            created_by=teacher_user.id
        )
        db.add(reassessment)
        await db.flush()
        db.add(AssessmentQuestion(assessment_id=reassessment.id, question_id=q_rec_trace.id, points=15.0, order_index=1))
        db.add(AssessmentQuestion(assessment_id=reassessment.id, question_id=q_str_reverse.id, points=15.0, order_index=2))
        await db.flush()

        print("🔄 Seeding complete Rahul Recursion Journey (Observe -> Diagnose -> Simulate -> Govern -> Reassess)...")
        # 5. Rahul's Initial Submission (Observed score: 40%)
        attempt_initial = AssessmentAttempt(
            assessment_id=diag_assessment.id,
            student_id=student_rahul.id,
            status="graded",
            start_time=datetime.now(timezone.utc) - timedelta(days=2),
            submit_time=datetime.now(timezone.utc) - timedelta(days=2),
            score=12.0,
            max_score=30.0,
            percentage=40.0,
            passed=False
        )
        db.add(attempt_initial)
        await db.flush()

        sub_initial = Submission(
            attempt_id=attempt_initial.id,
            student_id=student_rahul.id,
            assessment_id=diag_assessment.id,
            status="reviewed",
            submitted_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(sub_initial)
        await db.flush()

        # Answer 1: Incorrect answer (misunderstood stack frames)
        a1 = SubmissionAnswer(
            submission_id=sub_initial.id,
            question_id=q_rec_trace.id,
            student_answer="A",  # picked 3 instead of 5
            is_correct=False,
            score_awarded=0.0,
            max_score=10.0,
            automated_feedback="Incorrect. The call stack builds activation records for each frame until base condition."
        )
        # Answer 2: Correct base case MCQ
        a2 = SubmissionAnswer(
            submission_id=sub_initial.id,
            question_id=q_rec_base.id,
            student_answer="A",
            is_correct=True,
            score_awarded=10.0,
            max_score=10.0,
            automated_feedback="Correct selection."
        )
        # Answer 3: Partial credit / recursive Java-style approach without base case
        a3 = SubmissionAnswer(
            submission_id=sub_initial.id,
            question_id=q_str_reverse.id,
            student_answer="def reverse_string(s):\n    return reverse_string(s[1:]) + s[0]",
            code_language="python",
            is_correct=False,
            score_awarded=2.0,
            max_score=10.0,
            automated_feedback="RecursionError: maximum recursion depth exceeded (missing base case guard).",
            execution_results={"passed": False, "error": "RecursionError: maximum recursion depth exceeded"}
        )
        db.add_all([a1, a2, a3])

        gr_initial = GradingResult(
            submission_id=sub_initial.id,
            total_score=12.0,
            max_score=30.0,
            percentage=40.0,
            passed=False,
            topic_breakdown={
                topic_recursion.id: {"score": 12.0, "max": 30.0, "percentage": 40.0}
            }
        )
        db.add(gr_initial)
        await db.flush()

        # 6. Misconception Hypothesis & Root-Cause Edge
        misc_rahul = Misconception(
            student_id=student_rahul.id,
            topic_id=topic_recursion.id,
            concept="Recursive Execution & Base Cases",
            root_cause="Stack-Frame Execution Misunderstood",
            description=(
                "Student shows difficulty tracking how activation records unwind and forgets "
                "to guard against infinite recursion with a terminating base condition."
            ),
            status=MisconceptionStatus.TEACHER_CONFIRMED,
            confidence=0.88,
            evidence_summary="Incorrect stack frame tracing and unterminated recursive function in diagnostic assessment.",
            supporting_evidence=[q_rec_trace.id, q_str_reverse.id],
            detected_at=datetime.now(timezone.utc) - timedelta(days=2)
        )
        db.add(misc_rahul)
        await db.flush()

        db.add(MisconceptionRelationship(
            misconception_id=misc_rahul.id,
            prerequisite_topic_id=topic_stacks.id,
            strength=0.90,
            explanation="Weak understanding of call-stack memory frames directly causes recursive unwinding errors."
        ))

        # 7. Learner Digital Twin states for Rahul
        db.add_all([
            LearnerState(
                student_id=student_rahul.id,
                topic_id=topic_arrays.id,
                mastery_score=86.0,
                confidence=0.85,
                status=MasteryStatus.MASTERED,
                assessment_count=3,
                last_updated=datetime.now(timezone.utc) - timedelta(days=5)
            ),
            LearnerState(
                student_id=student_rahul.id,
                topic_id=topic_sorting.id,
                mastery_score=81.0,
                confidence=0.80,
                status=MasteryStatus.MASTERED,
                assessment_count=2,
                last_updated=datetime.now(timezone.utc) - timedelta(days=4)
            ),
            LearnerState(
                student_id=student_rahul.id,
                topic_id=topic_stacks.id,
                mastery_score=58.0,
                confidence=0.70,
                status=MasteryStatus.NEEDS_ATTENTION,
                assessment_count=2,
                last_updated=datetime.now(timezone.utc) - timedelta(days=3)
            ),
            LearnerState(
                student_id=student_rahul.id,
                topic_id=topic_recursion.id,
                mastery_score=40.0,
                confidence=0.65,
                status=MasteryStatus.NEEDS_ATTENTION,
                assessment_count=1,
                last_updated=datetime.now(timezone.utc) - timedelta(days=2)
            )
        ])

        # 8. Intervention Candidates & Versioned Approval
        interv_rahul = Intervention(
            student_id=student_rahul.id,
            target_concept="Recursive Execution & Base Cases",
            target_topic_id=topic_recursion.id,
            selected_strategy=InterventionStrategy.WORKED_EXAMPLE,
            reason="Observed recursion errors are associated with a likely prerequisite weakness in stack-frame execution.",
            confidence=0.88,
            expected_goal="Improve recursive execution understanding and base condition specification.",
            status=InterventionStatus.COMPLETED,
            teacher_status=TeacherReviewStatus.APPROVED,
            trigger_assessment_id=diag_assessment.id,
            reassessment_id=reassessment.id,
            created_at=datetime.now(timezone.utc) - timedelta(days=2),
            approved_at=datetime.now(timezone.utc) - timedelta(days=1, hours=20),
            completed_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        db.add(interv_rahul)
        await db.flush()

        reassessment.linked_intervention_id = interv_rahul.id

        # Candidates (Simulator output)
        c1 = InterventionCandidate(
            intervention_id=interv_rahul.id,
            strategy=InterventionStrategy.WORKED_EXAMPLE,
            title="Step-by-Step Worked Example: Call Stack Trace",
            intended_objective="Observe expert step-by-step trace of recursive frames and return unwinding.",
            reason="Cognitive modeling of stack push and pop mechanics directly addresses root cause.",
            supporting_evidence=["Diagnostic question 1 and 3 errors"],
            estimated_effort_minutes=12,
            difficulty="intermediate",
            expected_benefit_score=0.89,
            uncertainty=0.12,
            ranking_score=87.5,
            is_recommended=True,
            content_preview="Step-by-step trace of string reversal with call stack diagram."
        )
        c2 = InterventionCandidate(
            intervention_id=interv_rahul.id,
            strategy=InterventionStrategy.PREREQUISITE_LESSON,
            title="Prerequisite Primer: Stack Frames & Activation Records",
            intended_objective="Review call stack mechanics before returning to recursive algorithms.",
            reason="Reinforces foundational memory concepts.",
            supporting_evidence=["Stacks mastery currently at 58%"],
            estimated_effort_minutes=20,
            difficulty="beginner",
            expected_benefit_score=0.86,
            uncertainty=0.15,
            ranking_score=84.0,
            is_recommended=False,
            content_preview="Review of stack pointers, activation records, and return values."
        )
        c3 = InterventionCandidate(
            intervention_id=interv_rahul.id,
            strategy=InterventionStrategy.INTERACTIVE_VISUALIZATION,
            title="Interactive Call-Stack Visualizer",
            intended_objective="Manipulate recursive stack frames visually.",
            reason="Visual representation aids mental model formation.",
            supporting_evidence=["Student struggles with abstract memory states"],
            estimated_effort_minutes=15,
            difficulty="intermediate",
            expected_benefit_score=0.88,
            uncertainty=0.14,
            ranking_score=85.2,
            is_recommended=False,
            content_preview="Visual simulation of activation records."
        )
        db.add_all([c1, c2, c3])

        # Version 1 (AI proposal) and Version 2 (Teacher approved)
        v1 = InterventionVersion(
            intervention_id=interv_rahul.id,
            version_num=1,
            title=c1.title,
            strategy=c1.strategy,
            content={
                "steps": [
                    {"step_num": 1, "title": "Call Stack Trace", "type": "worked_example"}
                ]
            },
            created_by_role="ai",
            change_notes="Initial AI proposed candidate"
        )
        v2 = InterventionVersion(
            intervention_id=interv_rahul.id,
            version_num=2,
            title="Worked Example + Guided Practice on Call Stacks",
            strategy=InterventionStrategy.WORKED_EXAMPLE,
            content={
                "steps": [
                    {
                        "step_num": 1,
                        "title": "Worked Example: Tracing reverseString('cat')",
                        "type": "worked_example",
                        "body": "Step 1: reverseString('cat') calls reverseString('at') + 'c'\nStep 2: reverseString('at') calls reverseString('t') + 'a'\nStep 3: Base case reached ('t') returns immediately!\nStep 4: Unwinds to 't' + 'a' = 'ta'\nStep 5: Unwinds to 'ta' + 'c' = 'tac'"
                    },
                    {
                        "step_num": 2,
                        "title": "Guided Practice: Add Base Case Guard",
                        "type": "practice",
                        "body": "Ensure: if len(s) <= 1: return s is the very first line before recursive step."
                    }
                ]
            },
            created_by_role="teacher",
            author_id=teacher_user.id,
            change_notes="Teacher approved with added guided practice step"
        )
        db.add_all([v1, v2])

        # Teacher Review & Decision Records
        t_review = TeacherReview(
            submission_id=sub_initial.id,
            teacher_id=teacher_user.id,
            status="completed",
            method_review_outcome=MethodReviewOutcome.INCORRECT_ANSWER_VALID_REASONING,
            ai_evaluation={
                "method_name": "Unterminated Recursive Call",
                "reasoning": "The student attempted recursive decomposition but omitted the terminating base condition.",
                "confidence": 0.89
            },
            ai_suggested_marks=2.0,
            teacher_comments="Demonstrates partial understanding of recursion, but missing base case causes crash. Approved worked example intervention.",
            marks_awarded=4.0,  # teacher awarded 2 extra points of partial credit for valid recursive reasoning!
            is_alternative_accepted=False,
            reviewed_at=datetime.now(timezone.utc) - timedelta(days=1, hours=21)
        )
        db.add(t_review)

        t_decision = TeacherDecision(
            teacher_id=teacher_user.id,
            entity_type="intervention",
            entity_id=interv_rahul.id,
            decision_type="approve_intervention",
            original_state={"status": "proposed"},
            new_state={"status": "approved", "strategy": "worked_example"},
            justification="Approved worked example and appended guided practice on base conditions."
        )
        db.add(t_decision)

        # 9. Rahul's Post-Intervention Reassessment & Outcome (Score: 40% -> 78%)
        attempt_re = AssessmentAttempt(
            assessment_id=reassessment.id,
            student_id=student_rahul.id,
            status="graded",
            start_time=datetime.now(timezone.utc) - timedelta(hours=18),
            submit_time=datetime.now(timezone.utc) - timedelta(hours=18),
            score=23.4,
            max_score=30.0,
            percentage=78.0,
            passed=True
        )
        db.add(attempt_re)
        await db.flush()

        outcome_rahul = InterventionOutcome(
            intervention_id=interv_rahul.id,
            student_id=student_rahul.id,
            baseline_score=40.0,
            post_score=78.0,
            score_difference=38.0,
            success=True,
            objective_met=True,
            topic_mastery_before={"recursion": 40.0},
            topic_mastery_after={"recursion": 78.0},
            remaining_misconceptions=[],
            next_recommendation="Promote to independent practice on recursive tree structures and divide-and-conquer algorithms.",
            measured_at=datetime.now(timezone.utc) - timedelta(hours=18)
        )
        db.add(outcome_rahul)

        # 10. Alternative Solution Demo for Priya Singh:
        # A valid recursive Java solution accepted even though the reference answer uses iteration!
        attempt_priya = AssessmentAttempt(
            assessment_id=diag_assessment.id,
            student_id=student_priya.id,
            status="graded",
            start_time=datetime.now(timezone.utc) - timedelta(days=1),
            submit_time=datetime.now(timezone.utc) - timedelta(days=1),
            score=28.0,
            max_score=30.0,
            percentage=93.3,
            passed=True
        )
        db.add(attempt_priya)
        await db.flush()

        sub_priya = Submission(
            attempt_id=attempt_priya.id,
            student_id=student_priya.id,
            assessment_id=diag_assessment.id,
            status="reviewed",
            submitted_at=datetime.now(timezone.utc) - timedelta(days=1)
        )
        db.add(sub_priya)
        await db.flush()

        # Priya submits recursive solution for String Reversal
        ans_priya = SubmissionAnswer(
            submission_id=sub_priya.id,
            question_id=q_str_reverse.id,
            student_answer=(
                "public static String reverseString(String s) {\n"
                "    if (s == null || s.length() <= 1) return s;\n"
                "    return reverseString(s.substring(1)) + s.charAt(0);\n"
                "}"
            ),
            code_language="java",
            is_correct=True,
            score_awarded=10.0,
            max_score=10.0,
            automated_feedback="Alternative recursive approach detected. Forwarded for teacher method verification.",
            execution_results={"passed": True, "tests_passed": 3, "tests_total": 3}
        )
        db.add(ans_priya)

        review_priya = TeacherReview(
            submission_id=sub_priya.id,
            teacher_id=teacher_user.id,
            status="completed",
            method_review_outcome=MethodReviewOutcome.CORRECT_ALTERNATIVE_METHOD,
            ai_evaluation={
                "method_name": "Recursive Character-Swapping or Substring Approach",
                "is_valid_alternative": True,
                "confidence": 0.94,
                "reasoning": "The student implemented a recursive method for string reversal. The approach satisfies all functional constraints."
            },
            ai_suggested_marks=10.0,
            teacher_comments="Accepted valid recursive solution. Excellent demonstration of base condition handling and functional recursion.",
            marks_awarded=10.0,
            is_alternative_accepted=True,
            alternative_approach_name="Recursive Substring Divide-and-Conquer Reversal",
            reviewed_at=datetime.now(timezone.utc) - timedelta(hours=12)
        )
        db.add(review_priya)

        decision_priya = TeacherDecision(
            teacher_id=teacher_user.id,
            entity_type="submission",
            entity_id=sub_priya.id,
            decision_type="accept_alternative_solution",
            original_state={"method": "iterative_reference_expected"},
            new_state={"method": "Recursive Substring Divide-and-Conquer Reversal", "marks": 10.0},
            justification="Accepted valid alternative recursive solution with full marks."
        )
        db.add(decision_priya)

        # 11. Initial Notifications
        db.add_all([
            Notification(
                user_id=student_rahul.id,
                title="Reassessment Score: 78% (+38 pts)",
                message="Your recent reassessment demonstrates significant mastery improvement in Recursion! Keep going.",
                notification_type="achievement",
                link_url="/student/dashboard"
            ),
            Notification(
                user_id=teacher_user.id,
                title="Alternative Solution Accepted",
                message="Priya Singh's recursive string reversal was accepted as a valid alternative method.",
                notification_type="review_required",
                link_url="/teacher/review-queue"
            )
        ])

        await db.commit()
        print("✅ Database seeding completed successfully!")
        print("Demo Accounts:")
        print(" - Admin:   admin@agentedu.org   / AdminPass123!")
        print(" - Teacher: teacher@agentedu.org / TeacherPass123!")
        print(" - Student: rahul@agentedu.org   / StudentPass123!")
        print(" - Student: priya@agentedu.org   / StudentPass123!")


if __name__ == "__main__":
    asyncio.run(seed_database())
