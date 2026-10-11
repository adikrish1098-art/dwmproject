from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_

from app.core.database import get_operational_db
from app.models.operational import Appointment, Patient, Doctor, Department, AppointmentStatus, User
from app.schemas.clinical import AppointmentCreate, AppointmentResponse
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/appointments", tags=["Appointment Scheduling"])

schedulers = require_roles(["Administrator", "Doctor", "Receptionist"])

@router.get("/")
def list_appointments(
    date_str: Optional[str] = None,
    doctor_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(schedulers),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Appointment)
    if doctor_id:
        query = query.filter(Appointment.doctor_id == doctor_id)
    if status_filter:
        query = query.filter(Appointment.status == status_filter)
    if date_str:
        # Date string matching YYYY-MM-DD
        try:
            target_dt = datetime.strptime(date_str, "%Y-%m-%d")
            query = query.filter(
                and_(
                    Appointment.appointment_date >= target_dt,
                    Appointment.appointment_date < target_dt + timedelta(days=1)
                )
            )
        except ValueError:
            pass
            
    total = query.count()
    appts = query.order_by(Appointment.appointment_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "appointments": [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": a.patient.full_name if a.patient else "Unknown",
                "doctor_id": a.doctor_id,
                "doctor_name": a.doctor.name if a.doctor else "Unknown",
                "department_id": a.department_id,
                "department_name": a.department.name if a.department else "General",
                "appointment_date": a.appointment_date.isoformat(),
                "reason": a.reason,
                "status": a.status
            }
            for a in appts
        ]
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def schedule_appointment(
    req: AppointmentCreate,
    current_user: User = Depends(schedulers),
    db: Session = Depends(get_operational_db)
):
    # 1. Verify Patient exists
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient or not patient.is_active:
        raise HTTPException(status_code=400, detail="Invalid or inactive patient ID.")
        
    # 2. Verify Doctor exists
    doctor = db.query(Doctor).filter(Doctor.id == req.doctor_id).first()
    if not doctor or not doctor.is_active:
        raise HTTPException(status_code=400, detail="Invalid or inactive doctor ID.")
        
    # 3. Conflict Prevention: Check if doctor already has an active appointment within +/- 30 minutes
    time_window_start = req.appointment_date - timedelta(minutes=29)
    time_window_end = req.appointment_date + timedelta(minutes=29)
    
    conflict = db.query(Appointment).filter(
        Appointment.doctor_id == req.doctor_id,
        Appointment.status.in_(["Scheduled", "Confirmed"]),
        Appointment.appointment_date >= time_window_start,
        Appointment.appointment_date <= time_window_end
    ).first()
    
    if conflict:
        raise HTTPException(
            status_code=409,
            detail=f"Scheduling conflict: {doctor.name} already has an appointment booked at {conflict.appointment_date.strftime('%Y-%m-%d %H:%M')}."
        )
        
    # Auto-generate next Appointment ID
    last_apt = db.query(Appointment).order_by(Appointment.id.desc()).first()
    next_num = int(last_apt.id.split("-")[1]) + 1 if last_apt and "-" in last_apt.id else 5001
    new_id = f"APT-{next_num}"
    
    new_apt = Appointment(
        id=new_id,
        patient_id=req.patient_id,
        doctor_id=req.doctor_id,
        department_id=req.department_id,
        appointment_date=req.appointment_date,
        reason=req.reason,
        status=AppointmentStatus.SCHEDULED.value
    )
    db.add(new_apt)
    db.commit()
    
    log_audit_event(db, current_user, "APPOINTMENT_SCHEDULED", "appointments", f"Booked appointment {new_id} for patient {req.patient_id}")
    return {"message": "Appointment scheduled successfully.", "id": new_id}

@router.put("/{appointment_id}/status")
def update_appointment_status(
    appointment_id: str,
    data: dict,
    current_user: User = Depends(schedulers),
    db: Session = Depends(get_operational_db)
):
    apt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not apt:
        raise HTTPException(status_code=404, detail="Appointment not found.")
        
    new_status = data.get("status")
    if new_status not in [s.value for s in AppointmentStatus]:
        raise HTTPException(status_code=400, detail="Invalid appointment status value.")
        
    apt.status = new_status
    db.commit()
    log_audit_event(db, current_user, "APPOINTMENT_STATUS_UPDATE", "appointments", f"Set appointment {appointment_id} status to {new_status}")
    return {"message": f"Appointment status updated to {new_status}."}
