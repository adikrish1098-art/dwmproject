from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_operational_db
from app.models.operational import Doctor, Department, User
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/doctors", tags=["Doctor Management"])

clinical_read = require_roles(["Administrator", "Doctor", "Receptionist", "Data Analyst"])
admin_only = require_roles(["Administrator"])

@router.get("/")
def list_doctors(
    department_id: Optional[str] = None,
    is_available: Optional[bool] = None,
    current_user: User = Depends(clinical_read),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Doctor)
    if department_id:
        query = query.filter(Doctor.department_id == department_id)
    if is_available is not None:
        query = query.filter(Doctor.is_available == is_available)
        
    doctors = query.all()
    return [
        {
            "id": d.id,
            "name": d.name,
            "specialty": d.specialty,
            "department_id": d.department_id,
            "department_name": d.department.name if d.department else "General",
            "contact_number": d.contact_number,
            "email": d.email,
            "is_available": d.is_available,
            "is_active": d.is_active,
            "appointment_count": len(d.appointments),
            "admission_count": len(d.admissions)
        }
        for d in doctors
    ]

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_doctor(
    data: dict,
    current_user: User = Depends(admin_only),
    db: Session = Depends(get_operational_db)
):
    # Auto-generate next Doctor ID (e.g. DOC-117)
    last_doc = db.query(Doctor).order_by(Doctor.id.desc()).first()
    next_num = int(last_doc.id.split("-")[1]) + 1 if last_doc and "-" in last_doc.id else 101
    new_id = f"DOC-{next_num}"
    
    doc = Doctor(
        id=new_id,
        name=data.get("name", "").strip(),
        specialty=data.get("specialty", "").strip(),
        department_id=data.get("department_id"),
        contact_number=data.get("contact_number"),
        email=data.get("email"),
        is_available=True,
        is_active=True
    )
    db.add(doc)
    db.commit()
    log_audit_event(db, current_user, "DOCTOR_CREATED", "doctors", f"Created doctor {new_id} ({doc.name})")
    return {"message": "Doctor registered successfully", "id": new_id}
