import pytest
import httpx


@pytest.mark.asyncio
async def test_auth_register_and_login(client: httpx.AsyncClient):
    # Register new user
    res = await client.post(
        "/api/v1/auth/register",
        json={
            "email": "newbie@agentedu.org",
            "password": "Password123!",
            "full_name": "New Student",
            "role": "student"
        }
    )
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newbie@agentedu.org"
    assert data["user"]["role"] == "student"

    # Login with same user
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "newbie@agentedu.org", "password": "Password123!"}
    )
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


@pytest.mark.asyncio
async def test_rbac_teacher_and_admin_restrictions(client: httpx.AsyncClient, seed_users):
    student_headers = {"Authorization": f"Bearer {seed_users['student_token']}"}
    teacher_headers = {"Authorization": f"Bearer {seed_users['teacher_token']}"}
    admin_headers = {"Authorization": f"Bearer {seed_users['admin_token']}"}

    # Student cannot create classes (403 Forbidden)
    res_student_create_class = await client.post(
        "/api/v1/classes",
        headers=student_headers,
        json={"name": "Hacked Class", "code": "HACK101"}
    )
    assert res_student_create_class.status_code == 403

    # Teacher can create classes
    res_teacher_create_class = await client.post(
        "/api/v1/classes",
        headers=teacher_headers,
        json={"name": "Valid Algorithms Class", "code": "ALGO202"}
    )
    assert res_teacher_create_class.status_code == 201

    # Student cannot access admin metrics
    res_student_admin = await client.get("/api/v1/admin/metrics", headers=student_headers)
    assert res_student_admin.status_code == 403

    # Teacher cannot access admin metrics
    res_teacher_admin = await client.get("/api/v1/admin/metrics", headers=teacher_headers)
    assert res_teacher_admin.status_code == 403

    # Admin can access admin metrics
    res_admin = await client.get("/api/v1/admin/metrics", headers=admin_headers)
    assert res_admin.status_code == 200
    assert "total_users" in res_admin.json()
