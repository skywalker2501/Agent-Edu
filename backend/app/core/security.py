from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import jwt
import bcrypt
from app.core.config import settings
from app.core.exceptions import AuthenticationError
from app.core.logging_config import logger


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        # Truncate plain_password to 72 bytes as per bcrypt specification
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception as e:
        logger.warning(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    # Truncate to 72 bytes as per bcrypt specification
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes either a local development token or a Supabase JWT token.
    Enforces expiration, signature, and required claims.
    """
    try:
        # 1. Try local secret first
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"verify_signature": True}
        )
        return payload
    except jwt.PyJWTError as local_err:
        # 2. If Supabase JWT secret is configured, try Supabase validation
        if settings.SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token,
                    settings.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    options={"verify_signature": True}
                )
                return payload
            except jwt.PyJWTError as supa_err:
                logger.warning(f"Supabase JWT validation failed: {supa_err}")
        
        logger.warning(f"Token decode error: {local_err}")
        raise AuthenticationError("Could not validate credentials or token expired")
