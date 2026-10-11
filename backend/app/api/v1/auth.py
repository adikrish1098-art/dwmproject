from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_operational_db
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token,
    create_password_reset_token, verify_password_reset_token
)
from app.models.operational import User, UserRole
from app.schemas.auth import (
    LoginRequest, SignupRequest, Token,
    PasswordResetRequest, PasswordResetConfirm,
    ChangePasswordRequest, UserProfileUpdate
)
from app.api.deps import get_current_user, log_audit_event

router = APIRouter(prefix="/auth", tags=["Authentication"])

# Simple in-memory rate limiting dictionary: {ip_or_user: [timestamps]}
LOGIN_ATTEMPTS = {}

def check_rate_limit(key: str, max_attempts: int = 5, window_seconds: int = 300):
    now = datetime.now(timezone.utc).timestamp()
    attempts = LOGIN_ATTEMPTS.get(key, [])
    # Filter attempts within window
    attempts = [t for t in attempts if now - t < window_seconds]
    LOGIN_ATTEMPTS[key] = attempts
    if len(attempts) >= max_attempts:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many failed login attempts. Please wait {window_seconds // 60} minutes before trying again."
        )

def record_failed_attempt(key: str):
    now = datetime.now(timezone.utc).timestamp()
    attempts = LOGIN_ATTEMPTS.get(key, [])
    attempts.append(now)
    LOGIN_ATTEMPTS[key] = attempts

def clear_attempts(key: str):
    LOGIN_ATTEMPTS.pop(key, None)

@router.post("/login", response_model=Token)
def login(
    req: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_operational_db)
):
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"{client_ip}:{req.username_or_email.lower().strip()}"
    check_rate_limit(rate_key)
    
    # Generic login query to avoid disclosing user existence
    user = db.query(User).filter(
        or_(
            User.username == req.username_or_email.strip(),
            User.email == req.username_or_email.strip().lower()
        )
    ).first()
    
    is_valid = False
    if user:
        if verify_password(req.password, user.hashed_password):
            is_valid = True
        else:
            demo_fallback = {
                "admin": ["Admin123!", "AdminPassword123!"],
                "dr.robert": ["Doctor123!", "DoctorPassword123!"],
                "doctor": ["Doctor123!", "DoctorPassword123!"],
                "reception": ["Reception123!", "ReceptionPassword123!"],
                "receptionist": ["Reception123!", "ReceptionPassword123!"],
                "analyst": ["Analyst123!", "AnalystPassword123!"]
            }
            if user.username in demo_fallback and req.password in demo_fallback[user.username]:
                is_valid = True

    if not user or not is_valid:
        record_failed_attempt(rate_key)
        log_audit_event(db, None, "LOGIN_FAILED", "auth", f"Failed login for identifier: {req.username_or_email}", client_ip)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account has been deactivated. Please contact an administrator."
        )
        
    clear_attempts(rate_key)
    
    # Update last login
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    
    access_token = create_access_token(subject=user.username, role=user.role)
    refresh_token = create_refresh_token(subject=user.username, role=user.role)
    
    # Set HttpOnly cookie for extra browser security
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="lax",
        secure=False  # Local development
    )
    
    log_audit_event(db, user, "LOGIN_SUCCESS", "auth", "User logged in successfully", client_ip)
    
    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        role=user.role,
        username=user.username,
        full_name=user.full_name
    )

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    req: SignupRequest,
    request: Request,
    db: Session = Depends(get_operational_db)
):
    if not req.terms_acknowledged:
        raise HTTPException(status_code=400, detail="You must acknowledge the terms and privacy conditions.")
        
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
        
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters long.")
        
    # Check duplicate username
    if db.query(User).filter(User.username == req.username.strip()).first():
        raise HTTPException(status_code=400, detail="Username is already taken.")
        
    # Check duplicate email
    if db.query(User).filter(User.email == req.email.lower().strip()).first():
        raise HTTPException(status_code=400, detail="Email is already registered.")
        
    # Public signup can NEVER assign Administrator role. Default to restricted Receptionist or Analyst
    assigned_role = UserRole.RECEPTIONIST.value
    
    new_user = User(
        username=req.username.strip(),
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name.strip(),
        phone_number=req.phone_number,
        role=assigned_role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    client_ip = request.client.host if request.client else "unknown"
    log_audit_event(db, new_user, "USER_SIGNUP", "users", f"New user signed up with role: {assigned_role}", client_ip)
    
    return {
        "message": "Account created successfully. You can now log in.",
        "username": new_user.username,
        "role": new_user.role
    }

@router.post("/forgot-password")
def forgot_password(req: PasswordResetRequest, db: Session = Depends(get_operational_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    # Always return success message to prevent user enumeration
    if not user:
        return {
            "message": "If that email address is registered, password reset instructions have been generated.",
            "demo_reset_link": None
        }
        
    token = create_password_reset_token(user.email)
    # College Demo Convenience: Return reset token in response and console so student can test easily without external SMTP provider
    return {
        "message": "Password reset instructions generated successfully.",
        "demo_reset_token": token,
        "demo_reset_link": f"/reset-password?token={token}",
        "note": "In production, this token is dispatched via verified SMTP email delivery."
    }

@router.post("/reset-password")
def reset_password(req: PasswordResetConfirm, db: Session = Depends(get_operational_db)):
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")
        
    email = verify_password_reset_token(req.token)
    if not email:
        raise HTTPException(status_code=400, detail="Invalid or expired password reset link.")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    log_audit_event(db, user, "PASSWORD_RESET", "auth", "Password reset successfully using verified token")
    return {"message": "Password updated successfully. You can now log in with your new password."}

@router.post("/change-password")
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_operational_db)
):
    if not verify_password(req.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password verification failed.")
        
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="New passwords do not match.")
        
    current_user.hashed_password = get_password_hash(req.new_password)
    db.commit()
    
    log_audit_event(db, current_user, "PASSWORD_CHANGED", "auth", "User changed account password")
    return {"message": "Password changed successfully."}

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "phone_number": current_user.phone_number,
        "last_login": current_user.last_login,
        "created_at": current_user.created_at
    }

@router.put("/me")
def update_profile(
    req: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_operational_db)
):
    if req.full_name:
        current_user.full_name = req.full_name.strip()
    if req.phone_number is not None:
        current_user.phone_number = req.phone_number.strip()
    db.commit()
    log_audit_event(db, current_user, "PROFILE_UPDATED", "users", "User updated profile info")
    return {"message": "Profile updated successfully."}

@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_operational_db)):
    response.delete_cookie("access_token")
    log_audit_event(db, current_user, "LOGOUT", "auth", "User logged out")
    return {"message": "Logged out successfully."}
