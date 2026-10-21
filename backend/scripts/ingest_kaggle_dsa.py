import asyncio
import csv
import json
import os
import sys
from datetime import datetime, timezone

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import kagglehub
from app.core.config import settings
from app.core.database import AsyncSessionLocal, init_db
from app.models.user import User, UserRole
from app.models.classroom import Class
from app.models.curriculum import Topic, Concept, TopicPrerequisite
from app.models.assessment import Question, QuestionType, Assessment, AssessmentQuestion
from app.models.audit import LearningResource
from sqlalchemy import select


KAGGLE_TOKEN = settings.KAGGLE_API_TOKEN or os.getenv("KAGGLE_API_TOKEN", "")
os.environ["KAGGLE_API_TOKEN"] = KAGGLE_TOKEN


async def ingest_datasets():
    print("=" * 60)
    print("🚀 Ingesting Kaggle DSA Datasets into AgentEdu Knowledge Base")
    print("=" * 60)

    # 1. Authenticate with KaggleHub
    try:
        kagglehub.config.set_kaggle_api_token(KAGGLE_TOKEN)
        print("✅ KaggleHub API Token authenticated.")
    except Exception as e:
        print(f"⚠️ Warning configuring Kaggle token: {e}")

    # 2. Download / Access Datasets
    print("\n📦 Downloading / Verifying datasets via KaggleHub...")

    # Dataset 1: Parth Bhuskade (1,010 DSA Problems, Test Cases, Solutions)
    print("📥 Loading parthbhuskade/dsa-dataset-problems-test-cases-and-starter-codes...")
    p2_path = kagglehub.dataset_download("parthbhuskade/dsa-dataset-problems-test-cases-and-starter-codes")
    p2_json = os.path.join(p2_path, "dsa_questions_dataset.json")

    with open(p2_json, mode="r", encoding="utf-8") as f:
        dsa_problems = json.load(f)
    print(f"✅ Loaded {len(dsa_problems)} full DSA problems with test cases.")

    # Dataset 2: InductiveAnks (260 GeeksForGeeks Interview Questions)
    print("📥 Loading inductiveanks/dsa-questions-dataset...")
    p1_path = kagglehub.dataset_download("inductiveanks/dsa-questions-dataset")
    p1_csv = os.path.join(p1_path, "Geeks_For_Geeks_Questions_Dataset.csv")

    gfg_questions = []
    with open(p1_csv, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        gfg_questions = list(reader)
    print(f"✅ Loaded {len(gfg_questions)} GeeksForGeeks interview questions.")

    # 3. Database Ingestion
    print("\n🗄️ Connecting to AgentEdu Database...")
    await init_db()

    async with AsyncSessionLocal() as db:
        # Fetch Teacher User to assign as creator
        teacher_res = await db.execute(select(User).where(User.role == UserRole.TEACHER))
        teacher = teacher_res.scalars().first()
        teacher_id = teacher.id if teacher else None

        # Fetch CS102 Classroom
        class_res = await db.execute(select(Class).where(Class.code == "CS102-FALL"))
        cs102_class = class_res.scalars().first()

        # 4. Ensure Expanded Curriculum Topics Exist
        topic_defs = [
            ("arrays", "Arrays & Dynamic Lists", "Linear storage, two-pointer traversals, and contiguous memory models.", "Data Structures", 1),
            ("stacks", "Stacks & Call Frames", "LIFO execution semantics, call stack activation records, and bracket balancing.", "Data Structures", 2),
            ("linked_lists", "Linked Lists", "Node pointer traversal, pointer reversal, and cycle detection.", "Data Structures", 3),
            ("recursion", "Recursion & Divide-and-Conquer", "Recurrence relations, base cases, call tree branching, and backtracking.", "Algorithms", 4),
            ("sorting", "Sorting Algorithms", "Merge sort, Quick sort, and comparison-based partition paradigms.", "Algorithms", 5),
            ("searching", "Searching & Binary Search", "Monotonic predicate search and logarithmic bounds.", "Algorithms", 6),
            ("trees", "Trees & Binary Search Trees", "Hierarchical traversal (Pre/In/Post/BFS), BST invariants, and recursion over subtrees.", "Data Structures", 7),
            ("dp", "Dynamic Programming & Memoization", "Optimal substructure, overlapping subproblems, memo tables, and bottom-up tabulation.", "Algorithms", 8),
            ("graphs", "Graphs & Traversal Algorithms", "Adjacency representations, DFS, BFS, and shortest-path trees.", "Algorithms", 9),
        ]

        topics_map = {}
        for code, name, desc, cat, order in topic_defs:
            t_res = await db.execute(select(Topic).where(Topic.code == code))
            t = t_res.scalar_one_or_none()
            if not t:
                t = Topic(code=code, name=name, description=desc, category=cat, order_index=order)
                db.add(t)
                await db.flush()
                print(f"  ✨ Added Curriculum Topic: {name}")
            topics_map[code] = t

        # Ensure Key Concepts Exist
        concept_defs = [
            ("arrays", "arrays_two_pointers", "Two-Pointer Strategy", "beginner"),
            ("arrays", "arrays_sliding_window", "Sliding Window Optimization", "intermediate"),
            ("recursion", "recursion_base_case", "Base Termination Conditions", "beginner"),
            ("stacks", "stack_activation_records", "Call Stack Activation Records", "intermediate"),
            ("trees", "trees_binary_search_tree", "Binary Search Tree Invariants", "intermediate"),
            ("trees", "trees_depth_first_search", "Tree DFS & Recursion", "intermediate"),
            ("dp", "dp_memoization", "Memoization & Overlapping Subproblems", "intermediate"),
            ("graphs", "graphs_bfs_dfs", "Graph Traversals (BFS & DFS)", "advanced"),
        ]

        concepts_map = {}
        for t_code, c_code, c_name, diff in concept_defs:
            t = topics_map.get(t_code)
            if not t:
                continue
            c_res = await db.execute(select(Concept).where(Concept.code == c_code))
            c = c_res.scalar_one_or_none()
            if not c:
                c = Concept(topic_id=t.id, code=c_code, name=c_name, difficulty_level=diff)
                db.add(c)
                await db.flush()
            concepts_map[c_code] = c

        # Ensure Pedagogical Prerequisites Links Exist
        prereq_rules = [
            ("recursion", "stacks", 0.95, "Stack activation records explain recursive unwinding."),
            ("trees", "recursion", 0.90, "Tree traversals rely on recursive subtree decomposition."),
            ("dp", "recursion", 0.92, "Dynamic programming optimizes overlapping recursive subproblems."),
            ("graphs", "trees", 0.85, "Graphs generalize tree hierarchical representations."),
            ("sorting", "arrays", 0.88, "Sorting algorithms operate on contiguous array memory."),
        ]

        for target_code, prereq_code, strength, exp in prereq_rules:
            t_target = topics_map.get(target_code)
            t_prereq = topics_map.get(prereq_code)
            if t_target and t_prereq:
                existing_prereq = await db.execute(
                    select(TopicPrerequisite).where(
                        TopicPrerequisite.topic_id == t_target.id,
                        TopicPrerequisite.prerequisite_topic_id == t_prereq.id
                    )
                )
                if not existing_prereq.scalar_one_or_none():
                    db.add(TopicPrerequisite(
                        topic_id=t_target.id,
                        prerequisite_topic_id=t_prereq.id,
                        relationship_type="hard_prerequisite",
                        strength=strength,
                        explanation=exp
                    ))

        await db.commit()

        # 5. Categorize & Ingest Questions from Dataset 2
        print("\n🔍 Mapping and inserting curated DSA coding problems...")

        category_to_topic = {
            "arrays": "arrays",
            "two-pointers": "arrays",
            "sliding-window": "arrays",
            "stack": "stacks",
            "recursion": "recursion",
            "backtracking": "recursion",
            "trees": "trees",
            "trie": "trees",
            "sorting": "sorting",
            "binary-search": "searching",
            "dp-general": "dp",
            "graphs": "graphs",
        }

        # Filter high quality problems per topic
        ingested_questions_by_topic = {code: [] for code in topics_map.keys()}

        for item in dsa_problems:
            pat = item.get("pattern_category", "")
            topic_code = category_to_topic.get(pat)
            if not topic_code:
                continue

            # Limit to 5 per topic to keep database lean yet rich
            if len(ingested_questions_by_topic[topic_code]) >= 5:
                continue

            title = item.get("title")
            statement = item.get("statement", "")
            if not title or not statement:
                continue

            # Format test cases
            test_cases = []
            raw_cases = item.get("example_test_cases", []) + item.get("hidden_test_cases", [])[:3]
            for tc in raw_cases:
                test_cases.append({
                    "input": str(tc.get("stdin", "")),
                    "expected_output": str(tc.get("expected_stdout", "")),
                    "is_hidden": bool(tc.get("is_hidden", False))
                })

            # Format reference solution
            solutions = item.get("solutions", {})
            ref_answer = ""
            if isinstance(solutions, dict):
                ref_answer = solutions.get("python", "")
            elif isinstance(solutions, str):
                ref_answer = solutions

            starter_code = item.get("starter_code_python") or (
                "class Solution:\n    def solve(self, *args):\n        # Write your code here\n        pass\n"
            )

            # Check if question title already exists
            existing_q = await db.execute(select(Question).where(Question.title == title))
            if existing_q.scalar_one_or_none():
                continue

            t_obj = topics_map[topic_code]
            concept_key = (
                "trees_binary_search_tree" if topic_code == "trees" else
                "dp_memoization" if topic_code == "dp" else
                "graphs_bfs_dfs" if topic_code == "graphs" else
                "arrays_two_pointers" if topic_code == "arrays" else
                "recursion_base_case" if topic_code == "recursion" else None
            )
            c_obj = concepts_map.get(concept_key) if concept_key else None

            q = Question(
                topic_id=t_obj.id,
                concept_id=c_obj.id if c_obj else None,
                title=title,
                prompt=statement,
                question_type=QuestionType.PROGRAMMING,
                reference_answer=ref_answer,
                constraints={"language": "python", "timeout_seconds": 3, "tags": item.get("tags", [])},
                rubric={"hints": item.get("hints", []), "pattern_category": pat, "ac_rate": item.get("ac_rate")},
                test_cases=test_cases if test_cases else None,
                difficulty=(item.get("difficulty") or "intermediate").lower(),
                created_by=teacher_id
            )
            db.add(q)
            await db.flush()
            ingested_questions_by_topic[topic_code].append(q)

        await db.commit()

        total_ingested = sum(len(ql) for ql in ingested_questions_by_topic.values())
        print(f"✅ Successfully ingested {total_ingested} curated algorithmic questions across 8 topics.")

        # 6. Generate Assessments for CS102
        print("\n📝 Creating themed diagnostic and mastery assessments...")

        assessment_plans = [
            (
                "CS102 Diagnostic: Arrays & Two Pointers",
                "arrays",
                "Evaluate array manipulation, two-pointer convergence, and window boundaries.",
                "initial",
                25
            ),
            (
                "CS102 Diagnostic: Trees & Hierarchical Structures",
                "trees",
                "Examines tree traversal recursion, binary search tree invariants, and subtree aggregation.",
                "initial",
                30
            ),
            (
                "CS102 Diagnostic: Dynamic Programming Fundamentals",
                "dp",
                "Tests memoization state formulation, optimal substructure, and transition recurrence relations.",
                "initial",
                30
            ),
        ]

        for a_title, t_code, a_desc, a_type, time_limit in assessment_plans:
            existing_ass = await db.execute(select(Assessment).where(Assessment.title == a_title))
            if existing_ass.scalar_one_or_none():
                continue

            t_obj = topics_map.get(t_code)
            ass = Assessment(
                title=a_title,
                description=a_desc,
                class_id=cs102_class.id if cs102_class else None,
                topic_id=t_obj.id if t_obj else None,
                assessment_type=a_type,
                time_limit_minutes=time_limit,
                passing_score=65.0,
                is_active=True
            )
            db.add(ass)
            await db.flush()

            # Attach questions for this topic
            attached_questions = ingested_questions_by_topic.get(t_code, [])
            for idx, q_item in enumerate(attached_questions[:3]):
                db.add(AssessmentQuestion(
                    assessment_id=ass.id,
                    question_id=q_item.id,
                    points=10.0,
                    order_index=idx + 1
                ))
            print(f"  🎯 Created Assessment: {a_title} ({len(attached_questions[:3])} questions)")

        # 7. Ingest Learning Resources from GeeksForGeeks Dataset
        print("\n📚 Ingesting GeeksForGeeks reference learning assets...")
        gfg_sample = gfg_questions[:15]
        for item in gfg_sample:
            q_name = item.get("Question Name", "DSA Problem")
            diff = item.get("Difficulty Level", "Medium").lower()
            acc = item.get("Accuracy", "N/A")
            companies = item.get("Company Tags", "General")

            # Check duplicate
            res_check = await db.execute(select(LearningResource).where(LearningResource.title == f"Interview Insight: {q_name}"))
            if res_check.scalar_one_or_none():
                continue

            lr = LearningResource(
                title=f"Interview Insight: {q_name}",
                resource_type="worked_example",
                content=(
                    f"### {q_name}\n\n"
                    f"- **Historical Accuracy Rate:** {acc}\n"
                    f"- **Company Tags:** {companies}\n"
                    f"- **Difficulty Rating:** {diff.capitalize()}\n\n"
                    f"#### Pedagogical Strategy:\n"
                    f"Focus on identifying the underlying abstract data type and invariant state before coding."
                ),
                metadata_json={"companies": companies, "accuracy": acc, "source": "GeeksForGeeks Kaggle Dataset"},
                estimated_minutes=15,
                difficulty=diff,
                is_approved=True
            )
            db.add(lr)

        await db.commit()
        print("✅ Ingestion & Knowledge Graph Enhancement Complete!")
        print("=" * 60)


if __name__ == "__main__":
    asyncio.run(ingest_datasets())
