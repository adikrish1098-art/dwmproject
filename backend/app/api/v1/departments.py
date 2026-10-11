from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_operational_db
from app.models.operational import Department, Doctor, User
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/departments", tags=["Department Management"])

general_read = require_roles(["Administrator", "Doctor", "Receptionist", "Data Analyst"])
admin_only = require_roles(["Administrator"])

@router.get("/")
def list_departments(
    current_user: User = Depends(general_read),
    db: Session = Depends(get_operational_db)
):
    depts = db.query(Department).all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "description": d.description,
            "is_active": d.is_active,
            "doctor_count": len(d.doctors),
            "appointment_count": len(d.appointments),
            "admission_count": len(d.admissions)
        }
        for d in depts
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_department(
    data: dict,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    dept_id = data.get("id", "").strip().upper()
    name = data.get("name", "").strip()
    if not dept_id or not name:
        raise HTTPException(status_code=400, detail="Department ID and Name are required.")
        
    if db.query(Department).filter(Department.id == dept_id).first():
        raise HTTPException(status_code=400, detail="Department ID already exists.")
        
    dept = Department(
        id=dept_id,
        name=name,
        description=data.get("description"),
        is_active=True
    )
    db.add(dept)
    db.commit()
    log_audit_event(db, current_user, "DEPARTMENT_CREATED", "departments", f"Created department {dept_id} ({name})")
    return {"message": "Department created successfully", "id": dept_id}
