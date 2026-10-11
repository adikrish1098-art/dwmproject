from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import argon2
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from jose import jwt, JWTError
from app.core.config import settings

# Initialize Argon2 Password Hasher (OWASP recommended parameters)
ph = argon2.PasswordHasher(
    time_cost=2,
    memory_cost=19456,  # 19 MiB
    parallelism=1,
    hash_len=32,
    salt_len=16
)

def get_password_hash(password: str) -> str:
    """Hash password using Argon2id."""
    return ph.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against Argon2 hash."""
    try:
        return ph.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    """Generate short-lived JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def create_refresh_token(subject: Union[str, Any], role: str) -> str:
    """Generate refresh token."""
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {
        "sub": str(subject),
        "role": role,
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc)
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT token."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

def create_password_reset_token(email: str) -> str:
    """Generate a 15-minute single-use password reset token."""
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {
        "sub": email,
        "type": "reset_password",
        "exp": expire
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return the email if valid."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "reset_password":
            return None
        return payload.get("sub")
    except JWTError:
        return None
