from typing import List, Optional
from fastapi import Depends, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.exceptions import AuthenticationError, PermissionDeniedError
from app.models.user import User, UserRole

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    if not credentials or not credentials.credentials:
        raise AuthenticationError("Missing Bearer authorization token")

    token = credentials.credentials
    
    # Check for demo fallback tokens
    demo_tokens = {
        "demo-jwt-rahul-token": "rahul@agentedu.org",
        "demo-jwt-priya-token": "priya@agentedu.org",
        "demo-jwt-teacher-token": "teacher@agentedu.org",
        "demo-jwt-admin-token": "admin@agentedu.org",
    }
    if token in demo_tokens or token.startswith("demo-"):
        email = demo_tokens.get(token) or (
            "rahul@agentedu.org" if "rahul" in token else
            "priya@agentedu.org" if "priya" in token else
            "teacher@agentedu.org" if "teacher" in token else
            "admin@agentedu.org"
        )
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        if user:
            return user

    payload = decode_access_token(token)
    user_id_or_email = payload.get("sub")
    if not user_id_or_email:
        raise AuthenticationError("Invalid token payload: missing subject")

    # Look up user in database
    stmt = select(User).where(
        (User.id == user_id_or_email) | (User.email == user_id_or_email)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise AuthenticationError("User not found or credentials revoked")

    return user


def require_roles(allowed_roles: List[str]):
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise PermissionDeniedError(
                f"Role '{current_user.role}' is not authorized. Required: {allowed_roles}"
            )
        return current_user
    return role_checker


# Convenience role dependencies
require_student = require_roles([UserRole.STUDENT, UserRole.ADMIN])
require_teacher = require_roles([UserRole.TEACHER, UserRole.ADMIN])
require_admin = require_roles([UserRole.ADMIN])
