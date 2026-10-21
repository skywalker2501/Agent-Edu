import pytest
import httpx
from app.models.review import MethodReviewOutcome


@pytest.mark.asyncio
async def test_teacher_review_accept_alternative_method(client: httpx.AsyncClient, seed_users, db_session):
    teacher_headers = {"Authorization": f"Bearer {seed_users['teacher_token']}"}

    # 1. Create a class and assessment
    c_res = await client.post("/api/v1/classes", headers=teacher_headers, json={"name": "CS102", "code": "CS102-TEST"})
    class_id = c_res.json()["id"]

    a_res = await client.post("/api/v1/assessments", headers=teacher_headers, json={
        "title": "String Reversal Quiz",
        "class_id": class_id,
        "assessment_type": "initial"
    })
    assessment_id = a_res.json()["id"]

    # 2. Student submits
    student_headers = {"Authorization": f"Bearer {seed_users['student_token']}"}
    sub_res = await client.post("/api/v1/submissions", headers=student_headers, json={
        "assessment_id": assessment_id,
        "answers": []
    })
    sub_id = sub_res.json()["submission_id"]

    # 3. Teacher checks review queue
    q_res = await client.get("/api/v1/teacher-reviews", headers=teacher_headers)
    assert q_res.status_code == 200
    queue = q_res.json()
    assert len(queue) >= 1
    review_id = queue[0]["id"]

    # 4. Teacher accepts alternative solution
    dec_res = await client.post(
        f"/api/v1/teacher-reviews/{review_id}/decision",
        headers=teacher_headers,
        json={
            "method_review_outcome": MethodReviewOutcome.CORRECT_ALTERNATIVE_METHOD,
            "teacher_comments": "Accepted valid recursive solution instead of iterative reference.",
            "marks_awarded": 10.0,
            "is_alternative_accepted": True,
            "alternative_approach_name": "Recursive Character-Swapping"
        }
    )
    assert dec_res.status_code == 200
    data = dec_res.json()
    assert data["is_alternative_accepted"] is True
    assert data["method_review_outcome"] == MethodReviewOutcome.CORRECT_ALTERNATIVE_METHOD

    # 5. Verify decision is in decision history
    hist_res = await client.get("/api/v1/outcomes/decisions", headers=teacher_headers)
    assert hist_res.status_code == 200
    decisions = hist_res.json()
    assert any(d["decision_type"] == "method_review_override" for d in decisions)
