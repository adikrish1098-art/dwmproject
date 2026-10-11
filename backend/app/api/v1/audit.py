from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_operational_db
from app.models.operational import AuditLog, User
from app.api.deps import require_roles

router = APIRouter(prefix="/audit", tags=["Security & Audit Logging"])

admin_only = require_roles(["Administrator"])

@router.get("/logs")
def list_audit_logs(
    action: Optional[str] = None,
    username: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    query = db.query(AuditLog)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action.strip()}%"))
    if username:
        query = query.filter(AuditLog.username.ilike(f"%{username.strip()}%"))
        
    total = query.count()
    logs = query.order_by(AuditLog.timestamp.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "logs": [
            {
                "id": log.id,
                "user_id": log.user_id,
                "username": log.username,
                "action": log.action,
                "resource": log.resource,
                "details": log.details,
                "ip_address": log.ip_address,
                "timestamp": log.timestamp.isoformat()
            }
            for log in logs
        ]
    }
