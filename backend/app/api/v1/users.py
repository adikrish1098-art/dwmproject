from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_operational_db
from app.models.operational import User, UserRole
from app.core.security import get_password_hash
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/users", tags=["User Management"])

# Only Administrator can manage users
admin_only = require_roles(["Administrator"])

@router.get("/")
def list_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_admin: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    query = db.query(User)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(User.username.ilike(s), User.full_name.ilike(s), User.email.ilike(s)))
    if role:
        query = query.filter(User.role == role)
    if is_active is not None:
        query = query.filter(User.is_active == is_active)
        
    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "users": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "full_name": u.full_name,
                "role": u.role,
                "phone_number": u.phone_number,
                "is_active": u.is_active,
                "last_login": u.last_login,
                "created_at": u.created_at
            }
            for u in users
        ]
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def admin_create_user(
    data: dict,
    current_admin: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    username = data.get("username", "").strip()
    email = data.get("email", "").lower().strip()
    role = data.get("role", UserRole.RECEPTIONIST.value)
    password = data.get("password", "Welcome123!")
    full_name = data.get("full_name", "").strip()
    
    if not username or not email or not full_name:
        raise HTTPException(status_code=400, detail="Username, email, and full name are required.")
        
    if db.query(User).filter(User.username == username).first():
        raise HTTPException(status_code=400, detail="Username already exists.")
        
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(status_code=400, detail="Email already exists.")
        
    new_user = User(
        username=username,
        email=email,
        hashed_password=get_password_hash(password),
        full_name=full_name,
        phone_number=data.get("phone_number"),
        role=role,
        is_active=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_audit_event(db, current_admin, "USER_CREATED_BY_ADMIN", "users", f"Admin created user {username} with role {role}")
    return {"message": "User created successfully", "user_id": new_user.id}

@router.put("/{user_id}/role")
def update_user_role(
    user_id: int,
    data: dict,
    current_admin: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    new_role = data.get("role")
    if new_role not in [r.value for r in UserRole]:
        raise HTTPException(status_code=400, detail="Invalid role specified.")
        
    old_role = target_user.role
    target_user.role = new_role
    db.commit()
    
    log_audit_event(db, current_admin, "ROLE_CHANGED", "users", f"Changed role for {target_user.username} from {old_role} to {new_role}")
    return {"message": f"Role updated to {new_role} successfully."}

@router.put("/{user_id}/status")
def toggle_user_status(
    user_id: int,
    data: dict,
    current_admin: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    target_user = db.query(User).filter(User.id == user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    if target_user.id == current_admin.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own administrative account.")
        
    is_active = data.get("is_active", True)
    target_user.is_active = is_active
    db.commit()
    
    action_name = "ACCOUNT_ACTIVATED" if is_active else "ACCOUNT_DEACTIVATED"
    log_audit_event(db, current_admin, action_name, "users", f"Admin set {target_user.username} active={is_active}")
    return {"message": f"Account status set to {'active' if is_active else 'inactive'}."}
