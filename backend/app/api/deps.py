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
            if getattr(user, "status", None) == "suspended":
                raise PermissionDeniedError(f"Account is suspended: {user.suspended_reason or 'Access restricted by administrator.'}")
            if getattr(user, "status", None) == "deleted":
                raise AuthenticationError("This account has been deleted.")
            return user
        else:
            # Fallback mock user if not yet seeded
            fallback_role = UserRole.TEACHER if "teacher" in email else (UserRole.ADMIN if "admin" in email else UserRole.STUDENT)
            return User(
                id="c7335f22-ff32-41e7-95b7-383bdb8a87b6" if "rahul" in email else "demo-user-id",
                email=email,
                full_name="Rahul Gupta" if "rahul" in email else ("Priya Singh" if "priya" in email else "Demo User"),
                role=fallback_role,
                status="active"
            )

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
        raise AuthenticationError("User account not found")

    if getattr(user, "status", None) == "suspended":
        raise PermissionDeniedError(f"Account is suspended: {user.suspended_reason or 'Access restricted by administrator.'}")
    if getattr(user, "status", None) == "deleted":
        raise AuthenticationError("This account has been deleted.")

    return user


async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> Optional[User]:
    if not credentials or not credentials.credentials:
        return None
    try:
        return await get_current_user(credentials, db)
    except Exception:
        return None


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
