from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_operational_db
from app.models.operational import Admission, Patient, Doctor, Department, Encounter, AdmissionType, DischargeStatus, User
from app.schemas.clinical import AdmissionCreate, AdmissionResponse
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/admissions", tags=["Admission & Discharge Management"])

inpatient_staff = require_roles(["Administrator", "Doctor", "Receptionist"])

@router.get("/")
def list_admissions(
    department_id: Optional[str] = None,
    is_readmission: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(inpatient_staff),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Admission)
    if department_id:
        query = query.filter(Admission.department_id == department_id)
    if is_readmission is not None:
        query = query.filter(Admission.is_readmission_30d == is_readmission)
        
    total = query.count()
    adms = query.order_by(Admission.admission_date.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "admissions": [
            {
                "id": a.id,
                "patient_id": a.patient_id,
                "patient_name": a.patient.full_name if a.patient else "Unknown",
                "doctor_id": a.doctor_id,
                "doctor_name": a.doctor.name if a.doctor else "Unknown",
                "department_id": a.department_id,
                "department_name": a.department.name if a.department else "General",
                "admission_date": a.admission_date.isoformat(),
                "discharge_date": a.discharge_date.isoformat() if a.discharge_date else None,
                "length_of_stay": a.length_of_stay,
                "admission_type": a.admission_type,
                "discharge_status": a.discharge_status,
                "is_readmission_30d": a.is_readmission_30d,
                "prior_admission_id": a.prior_admission_id
            }
            for a in adms
        ]
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def register_admission(
    req: AdmissionCreate,
    current_user: User = Depends(inpatient_staff),
    db: Session = Depends(get_operational_db)
):
    patient = db.query(Patient).filter(Patient.id == req.patient_id).first()
    if not patient or not patient.is_active:
        raise HTTPException(status_code=400, detail="Invalid patient ID.")
        
    # Check prior discharge history for 30-day readmission rule:
    # A subsequent qualifying admission within <= 30 days of a prior discharge
    last_prior_adm = db.query(Admission).filter(
        Admission.patient_id == req.patient_id,
        Admission.discharge_date.isnot(None),
        Admission.discharge_date <= req.admission_date
    ).order_by(Admission.discharge_date.desc(), Admission.id.desc()).first()
    
    is_readm = False
    prior_id = None
    if last_prior_adm and last_prior_adm.discharge_date:
        days_diff = (req.admission_date - last_prior_adm.discharge_date).days
        if 0 <= days_diff <= 30:
            is_readm = True
            prior_id = last_prior_adm.id
            
    # Auto-generate next Admission ID reliably
    from sqlalchemy import text
    max_id_val = db.execute(text("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) FROM admissions WHERE id LIKE 'ADM-%'")).scalar()
    next_num = (max_id_val + 1) if max_id_val else 3001
    new_id = f"ADM-{next_num}"
    
    new_admission = Admission(
        id=new_id,
        patient_id=req.patient_id,
        department_id=req.department_id,
        doctor_id=req.doctor_id,
        admission_date=req.admission_date,
        admission_type=req.admission_type,
        discharge_status="Admitted",
        length_of_stay=0,
        is_readmission_30d=is_readm,
        prior_admission_id=prior_id
    )
    db.add(new_admission)
    db.commit()
    
    log_audit_event(db, current_user, "ADMISSION_REGISTERED", "admissions", f"Registered admission {new_id} (Readmission={is_readm})")
    return {
        "message": "Admission registered successfully.",
        "admission_id": new_id,
        "is_readmission_30d": is_readm,
        "prior_admission_id": prior_id
    }

@router.put("/{admission_id}/discharge")
def discharge_patient(
    admission_id: str,
    data: dict,
    current_user: User = Depends(inpatient_staff),
    db: Session = Depends(get_operational_db)
):
    adm = db.query(Admission).filter(Admission.id == admission_id).first()
    if not adm:
        raise HTTPException(status_code=404, detail="Admission not found.")
        
    disch_date_str = data.get("discharge_date")
    disch_status = data.get("discharge_status", DischargeStatus.DISCHARGED.value)
    
    disch_dt = datetime.strptime(disch_date_str, "%Y-%m-%d %H:%M:%S") if disch_date_str else datetime.now(timezone.utc)
    
    # Calculate exact length of stay in days
    los = max(1, (disch_dt - adm.admission_date).days)
    
    adm.discharge_date = disch_dt
    adm.length_of_stay = los
    adm.discharge_status = disch_status
    db.commit()
    
    log_audit_event(db, current_user, "PATIENT_DISCHARGED", "admissions", f"Discharged admission {admission_id} (LOS={los} days)")
    return {
        "message": f"Patient discharged successfully. Length of stay: {los} days.",
        "length_of_stay": los
    }
