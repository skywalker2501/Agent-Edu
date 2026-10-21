import pytest
import os
import sys
from typing import AsyncGenerator
import httpx
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.models.user import User, UserRole
from app.main import app

TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    future=True
)

TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with TestSessionLocal() as session:
        yield session

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[httpx.AsyncClient, None]:
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def seed_users(db_session: AsyncSession):
    student = User(
        email="test_student@agentedu.org",
        full_name="Test Student",
        role=UserRole.STUDENT,
        hashed_password=get_password_hash("Student123!")
    )
    teacher = User(
        email="test_teacher@agentedu.org",
        full_name="Test Teacher",
        role=UserRole.TEACHER,
        hashed_password=get_password_hash("Teacher123!")
    )
    admin = User(
        email="test_admin@agentedu.org",
        full_name="Test Admin",
        role=UserRole.ADMIN,
        hashed_password=get_password_hash("Admin123!")
    )
    db_session.add_all([student, teacher, admin])
    await db_session.commit()
    await db_session.refresh(student)
    await db_session.refresh(teacher)
    await db_session.refresh(admin)

    student_token = create_access_token({"sub": student.id, "role": student.role})
    teacher_token = create_access_token({"sub": teacher.id, "role": teacher.role})
    admin_token = create_access_token({"sub": admin.id, "role": admin.role})

    return {
        "student": student,
        "teacher": teacher,
        "admin": admin,
        "student_token": student_token,
        "teacher_token": teacher_token,
        "admin_token": admin_token
    }
