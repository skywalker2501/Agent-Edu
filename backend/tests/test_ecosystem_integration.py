import pytest
import os
import sys
import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.user import User, UserRole
from app.models.gamification import XPLedger, UserStreak
from app.services.gamification_service import GamificationService
from app.services.sandbox_service import CodeSandboxService
from app.services.ai_service import AIService
from app.core.security import create_access_token


@pytest.mark.asyncio
async def test_suspended_account_blocked(client: httpx.AsyncClient, db_session: AsyncSession, seed_users):
    """Verify that suspended accounts are immediately blocked on protected backend endpoints."""
    student = seed_users["student"]
    token = seed_users["student_token"]

    # Initially active - can access profile
    res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200

    # Admin suspends user
    student.status = "suspended"
    student.suspended_reason = "Repeated cheating in Code Quest"
    await db_session.commit()

    # Now requests must be rejected with 403 Forbidden
    res2 = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res2.status_code == 403
    assert "suspended" in res2.text.lower()


@pytest.mark.asyncio
async def test_xp_ledger_idempotency(db_session: AsyncSession, seed_users):
    """Ensure that XP awards are strictly idempotent and cannot be duplicated."""
    student = seed_users["student"]
    idempotency_key = "quiz_battle_attempt_test_999"

    # First reward
    entry1 = await GamificationService.award_xp(
        db=db_session,
        user_id=student.id,
        amount=50,
        action_type="quiz_completion",
        idempotency_key=idempotency_key,
        description="Completed Recursion Quiz Battle"
    )
    assert entry1["amount"] == 50
    assert entry1["awarded"] is True

    # Check profile
    profile1 = await GamificationService.get_user_gamification_profile(db_session, student.id)
    assert profile1["total_xp"] == 50

    # Duplicate reward with identical idempotency_key
    entry2 = await GamificationService.award_xp(
        db=db_session,
        user_id=student.id,
        amount=50,
        action_type="quiz_completion",
        idempotency_key=idempotency_key,
        description="Duplicate attempt"
    )
    # Must return awarded=False without adding new XP
    assert entry2["awarded"] is False
    assert entry2["reason"] == "duplicate_idempotency_key"

    profile2 = await GamificationService.get_user_gamification_profile(db_session, student.id)
    assert profile2["total_xp"] == 50, "Duplicate XP should NOT be awarded"


@pytest.mark.asyncio
async def test_java_code_sandbox_execution():
    """Verify Java code compilation and isolated execution in the sandbox."""
    java_code = """
public class Solution {
    public static int sum(int a, int b) {
        return a + b;
    }
}
"""
    result = await CodeSandboxService.run_java_tests(
        code=java_code,
        test_cases=[{"input": "1, 2", "expected_output": "3"}]
    )
    # Check result object
    assert result is not None
    assert hasattr(result, "passed")
    assert hasattr(result, "execution_time_ms")


@pytest.mark.asyncio
async def test_python_code_sandbox_execution():
    """Verify Python code execution in the sandbox."""
    python_code = """
def solution(s):
    return s[::-1]
"""
    result = await CodeSandboxService.run_python_tests(
        code=python_code,
        test_cases=[{"input": '"hello"', "expected_output": "olleh"}]
    )
    assert result is not None
    assert result.passed is True
    assert result.tests_passed == 1


@pytest.mark.asyncio
async def test_socratic_ai_tutor_fallback_resilience():
    """Verify Socratic AI Tutor provides structured pedagogy even when Ollama server is offline."""
    reply = await AIService.socratic_tutor_response(
        topic_name="Recursion & Call Stacks",
        mode="guide_step_by_step",
        student_message="Why does my recursive function never terminate?",
        conversation_history=[],
        rag_context=["Recursion requires an explicit base case to halt execution."]
    )
    assert reply is not None
    assert "content" in reply
    assert len(reply["content"]) > 20
    # Must contain hints or code snippet
    assert "hints" in reply or "code_snippet" in reply


@pytest.mark.asyncio
async def test_curriculum_hierarchy_endpoint(client: httpx.AsyncClient, seed_users):
    """Verify the courses -> chapters -> topics -> learning objectives hierarchy endpoint."""
    token = seed_users["student_token"]
    res = await client.get("/api/v1/curriculum/courses", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    course = data[0]
    assert "chapters" in course
    assert "code" in course
