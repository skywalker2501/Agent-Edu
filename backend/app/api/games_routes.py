import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.core.database import get_db
from app.models.user import User
from app.models.curriculum import Topic, Concept
from app.models.assessment import Question, QuestionType
from app.models.games import (
    GameSession, GameType, GameStatus, Flashcard, UserFlashcardReview, CodeChallenge
)
from app.models.learner import LearnerState, MasteryStatus
from app.services.sandbox_service import CodeSandboxService
from app.services.gamification_service import GamificationService
from app.api.deps import get_current_user

router = APIRouter(prefix="/games", tags=["Interactive Learning Games"])


# --- Seed Helper for Games Data ---
DEFAULT_CHALLENGES = [
    {
        "title": "Reverse a String in Java",
        "slug": "java-reverse-string",
        "language": "java",
        "topic_name": "Strings & Character Manipulation",
        "problem_statement": "Write a method `public static String reverse(String s)` that takes a string `s` and returns it reversed. Do not use built-in StringBuilder.reverse().",
        "initial_code": """public class Solution {
    public static String reverse(String s) {
        // Implement your solution using two pointers or character array
        char[] chars = s.toCharArray();
        int left = 0, right = chars.length - 1;
        while (left < right) {
            char temp = chars[left];
            chars[left] = chars[right];
            chars[right] = temp;
            left++;
            right--;
        }
        return new String(chars);
    }
}""",
        "test_cases_json": [
            {"input": "hello", "expected": "olleh"},
            {"input": "AgentEdu", "expected": "udEtnegA"},
            {"input": "a", "expected": "a"}
        ],
        "hints_json": [
            "Convert the string to a character array using s.toCharArray().",
            "Use two pointers: left starting at index 0, right at length - 1.",
            "Swap characters until the pointers meet in the middle."
        ],
        "difficulty": "easy",
        "xp_reward": 50
    },
    {
        "title": "Recursive Factorial in Python",
        "slug": "python-recursive-factorial",
        "language": "python",
        "topic_name": "Recursion & Call Stacks",
        "problem_statement": "Write a recursive function `factorial(n)` that returns the factorial of positive integer `n`. Must use recursion with an explicit base case.",
        "initial_code": """def factorial(n: int) -> int:
    # Base case
    if n <= 1:
        return 1
    # Recursive step
    return n * factorial(n - 1)
""",
        "test_cases_json": [
            {"input": 1, "expected": 1},
            {"input": 4, "expected": 24},
            {"input": 5, "expected": 120}
        ],
        "hints_json": [
            "What is the base case? For n <= 1, return 1.",
            "In the recursive step, multiply n by factorial(n - 1)."
        ],
        "difficulty": "easy",
        "xp_reward": 45
    },
    {
        "title": "Two-Sum Pointer Search in Java",
        "slug": "java-two-sum-sorted",
        "language": "java",
        "topic_name": "Arrays & Dynamic Lists",
        "problem_statement": "Given a 1-indexed sorted array of integers `numbers` and a `target`, find two numbers such that they add up to `target`. Return their 1-based indices as an array `int[]{index1, index2}`.",
        "initial_code": """public class Solution {
    public static int[] twoSum(int[] numbers, int target) {
        int left = 0, right = numbers.length - 1;
        while (left < right) {
            int sum = numbers[left] + numbers[right];
            if (sum == target) return new int[]{left + 1, right + 1};
            if (sum < target) left++;
            else right--;
        }
        return new int[]{};
    }
}""",
        "test_cases_json": [
            {"input": "numbers = [2,7,11,15], target = 9", "expected": "[1, 2]"},
            {"input": "numbers = [2,3,4], target = 6", "expected": "[1, 3]"}
        ],
        "hints_json": [
            "Because the array is already sorted, a two-pointer technique achieves O(n) time.",
            "If the sum is too small, advance the left pointer. If too large, retreat the right pointer."
        ],
        "difficulty": "medium",
        "xp_reward": 70
    }
]

DEFAULT_FLASHCARDS = [
    {
        "front_prompt": "What is the time complexity of looking up an element by index in a dynamic array (e.g. ArrayList)?",
        "back_solution": "O(1) constant time, because contiguous memory allows direct offset calculation `base_address + index * size`.",
        "card_type": "concept",
        "difficulty": "easy"
    },
    {
        "front_prompt": "What condition causes a StackOverflowError in recursive algorithms?",
        "back_solution": "Missing or unreachable base condition, causing infinite recursive calls that exhaust the thread's call-stack frame memory limit.",
        "card_type": "definition",
        "difficulty": "medium"
    },
    {
        "front_prompt": "In a Binary Search Tree (BST), which tree traversal yields the nodes in strictly sorted ascending order?",
        "back_solution": "In-Order Traversal (Left Subtree -> Root -> Right Subtree).",
        "card_type": "concept",
        "difficulty": "easy"
    },
    {
        "front_prompt": "What is the difference between Memoization (Top-Down) and Tabulation (Bottom-Up) in DP?",
        "back_solution": "Memoization uses recursion and caches subproblem outputs on-demand. Tabulation iteratively fills an array/table starting from base cases, eliminating recursion stack overhead.",
        "card_type": "concept",
        "difficulty": "medium"
    }
]


async def _ensure_seeded_games_data(db: AsyncSession):
    # Seed Flashcards if empty
    fc_count = (await db.execute(select(func.count(Flashcard.id)))).scalar()
    if fc_count == 0:
        topic_res = await db.execute(select(Topic).limit(1))
        topic = topic_res.scalar_one_or_none()
        topic_id = topic.id if topic else "seed-topic-1"
        for fc in DEFAULT_FLASHCARDS:
            db.add(Flashcard(
                topic_id=topic_id,
                front_prompt=fc["front_prompt"],
                back_solution=fc["back_solution"],
                card_type=fc["card_type"],
                difficulty=fc["difficulty"]
            ))

    # Seed Code Challenges if empty
    cc_count = (await db.execute(select(func.count(CodeChallenge.id)))).scalar()
    if cc_count == 0:
        topic_res = await db.execute(select(Topic).limit(1))
        topic = topic_res.scalar_one_or_none()
        topic_id = topic.id if topic else "seed-topic-1"
        for cc in DEFAULT_CHALLENGES:
            db.add(CodeChallenge(
                topic_id=topic_id,
                title=cc["title"],
                slug=cc["slug"],
                language=cc["language"],
                problem_statement=cc["problem_statement"],
                initial_code=cc["initial_code"],
                test_cases_json=cc["test_cases_json"],
                hints_json=cc["hints_json"],
                difficulty=cc["difficulty"],
                xp_reward=cc["xp_reward"]
            ))
    await db.commit()


# =========================================================================
# GAME A: QUIZ BATTLE
# =========================================================================

class QuizBattleSubmitRequest(BaseModel):
    session_id: str
    answers: Dict[str, str]  # question_id -> selected_option
    time_taken_seconds: int = 60


@router.post("/quiz-battle/start")
async def start_quiz_battle(
    topic_id: Optional[str] = None,
    difficulty: Optional[str] = "medium",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Starts a Quiz Battle round with 5 syllabus-linked questions."""
    await _ensure_seeded_games_data(db)

    # 1. Select questions
    stmt = select(Question)
    if topic_id:
        stmt = stmt.where(Question.topic_id == topic_id)
    stmt = stmt.limit(5)
    res = await db.execute(stmt)
    questions = res.scalars().all()

    # Fallback if no questions exist
    if not questions:
        # Get all questions
        res = await db.execute(select(Question).limit(5))
        questions = res.scalars().all()

    # 2. Create GameSession
    session = GameSession(
        user_id=current_user.id,
        game_type=GameType.QUIZ_BATTLE,
        topic_id=topic_id or (questions[0].topic_id if questions else None),
        status=GameStatus.IN_PROGRESS
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Format questions (do not leak reference answers!)
    q_data = [
        {
            "id": q.id,
            "title": q.title,
            "prompt": q.prompt,
            "options": q.options or ["True", "False"],
            "difficulty": q.difficulty
        }
        for q in questions
    ]

    return {
        "session_id": session.id,
        "game_type": "quiz_battle",
        "question_count": len(q_data),
        "questions": q_data,
        "time_limit_seconds": 120
    }


@router.post("/quiz-battle/submit")
async def submit_quiz_battle(
    payload: QuizBattleSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Grades Quiz Battle, awards XP idempotently, and returns breakdown."""
    stmt = select(GameSession).where(
        GameSession.id == payload.session_id,
        GameSession.user_id == current_user.id
    )
    session = (await db.execute(stmt)).scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Game session not found")

    if session.status == GameStatus.COMPLETED:
        return session.summary_json

    # Grade answers
    correct_count = 0
    total = len(payload.answers)
    breakdown = []

    for q_id, user_ans in payload.answers.items():
        q_stmt = select(Question).where(Question.id == q_id)
        q = (await db.execute(q_stmt)).scalar_one_or_none()
        if q:
            is_correct = (str(user_ans).strip().lower() == str(q.reference_answer).strip().lower())
            if is_correct:
                correct_count += 1
            breakdown.append({
                "question_id": q.id,
                "title": q.title,
                "user_answer": user_ans,
                "correct_answer": q.reference_answer,
                "is_correct": is_correct,
                "explanation": f"Reference: {q.reference_answer}"
            })

    accuracy = (correct_count / total) if total > 0 else 0.0
    xp_to_award = int(correct_count * 15 + (25 if accuracy >= 0.8 else 0))

    # Update session
    session.status = GameStatus.COMPLETED
    session.score = correct_count * 10
    session.accuracy = accuracy
    session.time_taken_seconds = payload.time_taken_seconds
    session.xp_awarded = xp_to_award
    session.completed_at = datetime.now(timezone.utc)

    # Award verified XP via GamificationService
    idempotency_key = f"quiz_battle_{session.id}"
    await GamificationService.award_xp(
        db=db,
        user_id=current_user.id,
        amount=xp_to_award,
        action_type="quiz_battle_completed",
        idempotency_key=idempotency_key,
        description=f"Quiz Battle ({correct_count}/{total} correct, {int(accuracy * 100)}% accuracy)",
        reference_id=session.id
    )

    summary = {
        "session_id": session.id,
        "score": session.score,
        "correct_count": correct_count,
        "total_questions": total,
        "accuracy": accuracy,
        "xp_awarded": xp_to_award,
        "time_taken_seconds": payload.time_taken_seconds,
        "breakdown": breakdown
    }
    session.summary_json = summary
    await db.commit()

    return summary


# =========================================================================
# GAME B: CONCEPT MATCH
# =========================================================================

class ConceptMatchSubmitRequest(BaseModel):
    pairs_matched: List[Dict[str, str]]  # list of {"concept": ..., "definition": ...}


@router.get("/concept-match")
async def get_concept_match(
    topic_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns randomized terms and matching definitions for Concept Match game."""
    await _ensure_seeded_games_data(db)

    # Fetch concepts or flashcards
    stmt = select(Flashcard).limit(6)
    cards = (await db.execute(stmt)).scalars().all()

    items = []
    for c in cards:
        items.append({
            "id": c.id,
            "term": c.front_prompt[:60] + "...",
            "match": c.back_solution[:80] + "..."
        })

    # Separate terms and definitions, randomized
    import random
    terms = [{"id": i["id"], "text": i["term"]} for i in items]
    definitions = [{"id": i["id"], "text": i["match"]} for i in items]
    random.shuffle(terms)
    random.shuffle(definitions)

    return {
        "game_type": "concept_match",
        "terms": terms,
        "definitions": definitions,
        "pair_count": len(items)
    }


@router.post("/concept-match/submit")
async def submit_concept_match(
    payload: ConceptMatchSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verifies matches and awards XP."""
    correct_matches = 0
    total = len(payload.pairs_matched)

    for pair in payload.pairs_matched:
        card_id = pair.get("term_id")
        def_id = pair.get("def_id")
        if card_id and def_id and card_id == def_id:
            correct_matches += 1

    accuracy = (correct_matches / total) if total > 0 else 0.0
    xp = int(correct_matches * 10)

    idempotency = f"concept_match_{current_user.id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
    await GamificationService.award_xp(
        db=db,
        user_id=current_user.id,
        amount=xp,
        action_type="concept_match_completed",
        idempotency_key=idempotency,
        description=f"Concept Match ({correct_matches}/{total} matched)"
    )

    return {
        "correct_matches": correct_matches,
        "total_pairs": total,
        "accuracy": accuracy,
        "xp_awarded": xp
    }


# =========================================================================
# GAME C: CODE QUEST (Java & Python Sandbox)
# =========================================================================

class CodeQuestRunRequest(BaseModel):
    challenge_slug: str
    code: str
    language: str = "java"


@router.get("/code-quest/challenges")
async def list_code_challenges(
    language: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Lists available Code Quest challenges."""
    await _ensure_seeded_games_data(db)

    stmt = select(CodeChallenge)
    if language:
        stmt = stmt.where(CodeChallenge.language == language.lower())
    res = await db.execute(stmt)
    challenges = res.scalars().all()

    return [
        {
            "id": c.id,
            "title": c.title,
            "slug": c.slug,
            "language": c.language,
            "difficulty": c.difficulty,
            "xp_reward": c.xp_reward,
            "problem_statement": c.problem_statement[:140] + "..."
        }
        for c in challenges
    ]


@router.get("/code-quest/challenges/{slug}")
async def get_code_challenge(
    slug: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns challenge details, starter code, test cases, and hints."""
    await _ensure_seeded_games_data(db)

    stmt = select(CodeChallenge).where(CodeChallenge.slug == slug)
    c = (await db.execute(stmt)).scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Challenge not found")

    return {
        "id": c.id,
        "title": c.title,
        "slug": c.slug,
        "language": c.language,
        "problem_statement": c.problem_statement,
        "initial_code": c.initial_code,
        "test_cases": c.test_cases_json,
        "hints": c.hints_json,
        "difficulty": c.difficulty,
        "xp_reward": c.xp_reward
    }


@router.post("/code-quest/execute")
async def execute_code_quest(
    payload: CodeQuestRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Executes student code in isolated sandbox and returns test results."""
    stmt = select(CodeChallenge).where(CodeChallenge.slug == payload.challenge_slug)
    c = (await db.execute(stmt)).scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Challenge not found")

    test_cases = c.test_cases_json or []
    exec_result = await CodeSandboxService.evaluate_code(
        code=payload.code,
        language=payload.language or c.language,
        test_cases=test_cases
    )

    return {
        "passed": exec_result.get("passed", False),
        "tests_passed": exec_result.get("tests_passed", 0),
        "tests_total": exec_result.get("tests_total", len(test_cases)),
        "output": exec_result.get("output", ""),
        "execution_time_ms": exec_result.get("execution_time_ms", 0),
        "error": exec_result.get("error"),
        "test_details": exec_result.get("test_details", [])
    }


@router.post("/code-quest/submit")
async def submit_code_quest(
    payload: CodeQuestRunRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Validates challenge completion, awards XP, and records achievement."""
    stmt = select(CodeChallenge).where(CodeChallenge.slug == payload.challenge_slug)
    c = (await db.execute(stmt)).scalar_one_or_none()
    if not c:
        raise HTTPException(status_code=404, detail="Challenge not found")

    exec_result = await CodeSandboxService.evaluate_code(
        code=payload.code,
        language=payload.language or c.language,
        test_cases=c.test_cases_json
    )

    passed = exec_result.get("passed", False)
    xp_awarded = 0

    if passed:
        xp_awarded = c.xp_reward
        idempotency = f"code_quest_{current_user.id}_{c.slug}"
        await GamificationService.award_xp(
            db=db,
            user_id=current_user.id,
            amount=xp_awarded,
            action_type="challenge_solved",
            idempotency_key=idempotency,
            description=f"Solved Code Quest Challenge: {c.title}",
            reference_id=c.id
        )

    return {
        "passed": passed,
        "tests_passed": exec_result.get("tests_passed", 0),
        "tests_total": exec_result.get("tests_total", len(c.test_cases_json)),
        "xp_awarded": xp_awarded,
        "output": exec_result.get("output", ""),
        "error": exec_result.get("error")
    }


# =========================================================================
# GAME D: FLASHCARD SPRINT (Spaced Repetition)
# =========================================================================

class FlashcardReviewRequest(BaseModel):
    flashcard_id: str
    mastery_rating: str = Field(..., description="known, uncertain, or not_understood")


@router.get("/flashcards")
async def get_due_flashcards(
    topic_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns flashcards due for review using spaced repetition schedule."""
    await _ensure_seeded_games_data(db)

    # Fetch all flashcards
    stmt = select(Flashcard)
    if topic_id:
        stmt = stmt.where(Flashcard.topic_id == topic_id)
    cards = (await db.execute(stmt)).scalars().all()

    # Get user reviews
    rev_stmt = select(UserFlashcardReview).where(UserFlashcardReview.user_id == current_user.id)
    reviews = {r.flashcard_id: r for r in (await db.execute(rev_stmt)).scalars().all()}

    now = datetime.now(timezone.utc)
    due_cards = []

    for c in cards:
        rev = reviews.get(c.id)
        is_due = (rev is None or rev.next_review_due <= now)
        if is_due:
            due_cards.append({
                "id": c.id,
                "front_prompt": c.front_prompt,
                "back_solution": c.back_solution,
                "card_type": c.card_type,
                "difficulty": c.difficulty,
                "interval_days": rev.interval_days if rev else 0,
                "review_count": rev.review_count if rev else 0
            })

    return {
        "game_type": "flashcard_sprint",
        "due_count": len(due_cards),
        "flashcards": due_cards
    }


@router.post("/flashcards/review")
async def review_flashcard(
    payload: FlashcardReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Updates card review interval using Leitner/SM-2 schedule."""
    rating = payload.mastery_rating.lower()
    stmt = select(UserFlashcardReview).where(
        UserFlashcardReview.user_id == current_user.id,
        UserFlashcardReview.flashcard_id == payload.flashcard_id
    )
    rev = (await db.execute(stmt)).scalar_one_or_none()

    # Intervals: 1 day, 3 days, 7 days, 14 days, 30 days
    now = datetime.now(timezone.utc)
    if rating == "known":
        next_interval = min(30, (rev.interval_days * 2) if rev else 3)
    elif rating == "uncertain":
        next_interval = 1
    else:  # not_understood
        next_interval = 1

    next_due = now + timedelta(days=next_interval)

    if rev:
        rev.mastery_rating = rating
        rev.interval_days = next_interval
        rev.review_count += 1
        rev.next_review_due = next_due
        rev.last_reviewed_at = now
    else:
        rev = UserFlashcardReview(
            user_id=current_user.id,
            flashcard_id=payload.flashcard_id,
            mastery_rating=rating,
            interval_days=next_interval,
            review_count=1,
            next_review_due=next_due,
            last_reviewed_at=now
        )
        db.add(rev)

    # Award 5 XP for verified card review
    idempotency = f"fc_{current_user.id}_{payload.flashcard_id}_{now.strftime('%Y%m%d')}"
    await GamificationService.award_xp(
        db=db,
        user_id=current_user.id,
        amount=5,
        action_type="flashcard_reviewed",
        idempotency_key=idempotency,
        description="Flashcard Spaced Repetition Review"
    )

    await db.commit()
    return {
        "flashcard_id": payload.flashcard_id,
        "mastery_rating": rating,
        "next_interval_days": next_interval,
        "next_review_due": next_due.isoformat()
    }


# =========================================================================
# GAME E: ADAPTIVE CHALLENGE
# =========================================================================

@router.get("/adaptive-challenge/next")
async def get_adaptive_challenge_next(
    topic_id: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Selects the next adaptive question based on student's topic mastery score.
    Low mastery (<0.6) yields easier scaffolding questions. High mastery (>=0.8) yields harder questions.
    """
    # 1. Check student's current mastery
    target_topic_id = topic_id
    if not target_topic_id:
        t_res = await db.execute(select(Topic).limit(1))
        t = t_res.scalar_one_or_none()
        target_topic_id = t.id if t else "topic-1"

    m_stmt = select(LearnerState).where(
        LearnerState.student_id == current_user.id,
        LearnerState.topic_id == target_topic_id
    )
    learner_state = (await db.execute(m_stmt)).scalar_one_or_none()
    mastery_score = learner_state.mastery_score if learner_state else 0.5

    difficulty = "easy" if mastery_score < 0.6 else "hard" if mastery_score >= 0.8 else "medium"

    # 2. Select appropriate question
    q_stmt = select(Question).where(
        Question.topic_id == target_topic_id,
        Question.difficulty == difficulty
    ).limit(1)
    q = (await db.execute(q_stmt)).scalar_one_or_none()

    if not q:
        q = (await db.execute(select(Question).limit(1))).scalar_one_or_none()

    reason = (
        f"Selected prerequisite difficulty because your current topic mastery is {int(mastery_score * 100)}%."
        if mastery_score < 0.6 else
        f"Selected advanced challenge to test retention (topic mastery: {int(mastery_score * 100)}%)."
    )

    return {
        "game_type": "adaptive_challenge",
        "topic_id": target_topic_id,
        "current_mastery_score": mastery_score,
        "difficulty_selected": difficulty,
        "pedagogical_reason": reason,
        "question": {
            "id": q.id if q else "q-adaptive-1",
            "title": q.title if q else "Concept Application",
            "prompt": q.prompt if q else "Explain the primary termination criteria of this algorithm.",
            "options": q.options if (q and q.options) else ["Base case reached", "Infinite loop", "Stack full"],
            "difficulty": difficulty
        }
    }


# =========================================================================
# GAME F: CODE & CONCEPT WORD SCRAMBLE PUZZLE
# =========================================================================

class WordPuzzleSubmitRequest(BaseModel):
    puzzle_id: str
    solution_attempt: str
    hints_used: int = 0


PUZZLES = [
    {
        "id": "puz-1",
        "scrambled": "RCEURISNO",
        "answer": "RECURSION",
        "category": "Algorithmic Paradigms",
        "hint": "A programming technique where a function calls itself until a base condition is met."
    },
    {
        "id": "puz-2",
        "scrambled": "MMEIOAZOTIN",
        "answer": "MEMOIZATION",
        "category": "Dynamic Programming",
        "hint": "Top-down caching of expensive recursive subproblem return values."
    },
    {
        "id": "puz-3",
        "scrambled": "POYLMROPHSIM",
        "answer": "POLYMORPHISM",
        "category": "Object-Oriented Design",
        "hint": "The ability of an object to take on multiple forms via interfaces or method overriding."
    },
    {
        "id": "puz-4",
        "scrambled": "DIJKSTRAS",
        "answer": "DIJKSTRA",
        "category": "Graph Theory",
        "hint": "Greedy shortest-path algorithm using a priority queue for non-negative edge weights."
    },
    {
        "id": "puz-5",
        "scrambled": "BAKCRACTIKNG",
        "answer": "BACKTRACKING",
        "category": "Search & Combinatorics",
        "hint": "Algorithmic paradigm that tries candidate solutions incrementally and abandons failures."
    }
]


@router.get("/puzzles")
async def list_word_puzzles(
    current_user: User = Depends(get_current_user)
):
    """Returns word scramble puzzles without leaking the raw answer string."""
    return [
        {
            "id": p["id"],
            "scrambled": p["scrambled"],
            "category": p["category"],
            "hint": p["hint"],
            "length": len(p["answer"])
        }
        for p in PUZZLES
    ]


@router.post("/puzzles/submit")
async def submit_word_puzzle(
    payload: WordPuzzleSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Verifies puzzle solution, awards verified XP, and updates leaderboard."""
    puzzle = next((p for p in PUZZLES if p["id"] == payload.puzzle_id), None)
    if not puzzle:
        raise HTTPException(status_code=404, detail="Puzzle not found")

    is_correct = (payload.solution_attempt.strip().upper() == puzzle["answer"].upper())
    xp_to_award = 0
    if is_correct:
        base_xp = 30
        penalty = min(15, payload.hints_used * 5)
        xp_to_award = max(10, base_xp - penalty)
        idempotency = f"word_puzzle_{current_user.id}_{puzzle['id']}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}"
        await GamificationService.award_xp(
            db=db,
            user_id=current_user.id,
            amount=xp_to_award,
            action_type="puzzle_solved",
            idempotency_key=idempotency,
            description=f"Solved Word Scramble: {puzzle['answer']}",
            reference_id=puzzle["id"]
        )

    return {
        "is_correct": is_correct,
        "xp_awarded": xp_to_award,
        "correct_answer": puzzle["answer"] if is_correct else None,
        "explanation": puzzle["hint"]
    }


# =========================================================================
# GAME G: SPEED COMPLEXITY & LOGIC QUICKFIRE
# =========================================================================

class QuickfireSubmitRequest(BaseModel):
    score: int
    correct_count: int
    total_questions: int


@router.post("/quickfire/submit")
async def submit_quickfire(
    payload: QuickfireSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Awards XP for Algorithmic Speed Quickfire round."""
    xp = int(payload.correct_count * 12)
    if xp > 0:
        idempotency = f"quickfire_{current_user.id}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}"
        await GamificationService.award_xp(
            db=db,
            user_id=current_user.id,
            amount=xp,
            action_type="quickfire_completed",
            idempotency_key=idempotency,
            description=f"Speed Quickfire ({payload.correct_count}/{payload.total_questions} correct)"
        )
    return {
        "status": "recorded",
        "xp_awarded": xp,
        "correct_count": payload.correct_count
    }
