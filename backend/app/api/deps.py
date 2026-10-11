from typing import Generator, Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import get_operational_db, get_warehouse_db
from app.core.security import decode_token
from app.models.operational import User, AuditLog

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login", auto_error=False)

def get_current_user(
    request: Request,
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_operational_db)
) -> User:
    """Extract and validate current authenticated user from Bearer token or HttpOnly cookie."""
    # Check cookie fallback if bearer header is not passed
    if not token:
        token = request.cookies.get("access_token")
        if token and token.startswith("Bearer "):
            token = token[7:]
            
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired or invalid credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    username: str = payload.get("sub")
    if username is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token payload.",
        )
        
    user = db.query(User).filter(User.username == username).first()
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated or not found.",
        )
        
    return user

def require_roles(allowed_roles: List[str]):
    """Role-Based Access Control dependency factory enforcing backend permissions."""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {', '.join(allowed_roles)}. Your role: {current_user.role}."
            )
        return current_user
    return role_checker

def log_audit_event(
    db: Session,
    user: Optional[User],
    action: str,
    resource: str,
    details: Optional[str] = None,
    ip_address: Optional[str] = None
):
    """Safely log audit event without recording sensitive passwords or tokens."""
    try:
        audit_record = AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else "anonymous",
            action=action,
            resource=resource,
            details=details,
            ip_address=ip_address,
            timestamp=datetime.now(timezone.utc)
        )
        db.add(audit_record)
        db.commit()
    except Exception:
        db.rollback()
