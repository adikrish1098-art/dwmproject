from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.core.database import get_operational_db
from app.models.operational import Patient, User, UserRole
from app.schemas.clinical import PatientCreate, PatientUpdate, PatientResponse
from app.api.deps import get_current_user, require_roles, log_audit_event

router = APIRouter(prefix="/patients", tags=["Patient Management"])

# Permitted roles for patient registry
clinical_access = require_roles(["Administrator", "Doctor", "Receptionist", "Data Analyst"])
clinical_writers = require_roles(["Administrator", "Doctor", "Receptionist"])

@router.get("/")
def list_patients(
    search: Optional[str] = None,
    sex: Optional[str] = None,
    is_active: Optional[bool] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(clinical_access),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Patient)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Patient.id.ilike(s), Patient.full_name.ilike(s), Patient.phone_number.ilike(s)))
    if sex:
        query = query.filter(Patient.sex == sex)
    if is_active is not None:
        query = query.filter(Patient.is_active == is_active)
        
    total = query.count()
    patients = query.order_by(Patient.id.asc()).offset(skip).limit(limit).all()
    
    # Data Analyst role sees de-identified / masked data
    is_analyst = (current_user.role == UserRole.DATA_ANALYST.value)
    
    res = []
    for p in patients:
        res.append({
            "id": p.id,
            "full_name": f"De-identified ({p.id})" if is_analyst else p.full_name,
            "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
            "age": p.age,
            "sex": p.sex,
            "phone_number": "***-***-****" if is_analyst else p.phone_number,
            "email": "***@***.org" if is_analyst else p.email,
            "address": "Masked Address" if is_analyst else p.address,
            "emergency_contact": "Masked" if is_analyst else p.emergency_contact,
            "is_active": p.is_active,
            "created_at": p.created_at
        })
        
    return {"total": total, "patients": res}

@router.get("/{patient_id}")
def get_patient_profile(
    patient_id: str,
    current_user: User = Depends(clinical_access),
    db: Session = Depends(get_operational_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")
        
    is_analyst = (current_user.role == UserRole.DATA_ANALYST.value)
    
    # Encounters and Admissions history
    enc_data = []
    for e in patient.encounters:
        enc_data.append({
            "id": e.id,
            "encounter_date": e.encounter_date.isoformat(),
            "encounter_type": e.encounter_type,
            "department_id": e.department_id,
            "doctor_id": e.doctor_id,
            "diagnoses": [d.diagnosis_category for d in e.diagnoses],
            "treatments": [t.procedure_name for t in e.treatments]
        })
        
    adm_data = []
    for a in patient.admissions:
        adm_data.append({
            "id": a.id,
            "admission_date": a.admission_date.isoformat(),
            "discharge_date": a.discharge_date.isoformat() if a.discharge_date else None,
            "length_of_stay": a.length_of_stay,
            "admission_type": a.admission_type,
            "is_readmission_30d": a.is_readmission_30d,
            "prior_admission_id": a.prior_admission_id
        })
        
    return {
        "patient": {
            "id": patient.id,
            "full_name": f"De-identified ({patient.id})" if is_analyst else patient.full_name,
            "date_of_birth": patient.date_of_birth.isoformat() if patient.date_of_birth else None,
            "age": patient.age,
            "sex": patient.sex,
            "phone_number": "***-***-****" if is_analyst else patient.phone_number,
            "email": "***@***.org" if is_analyst else patient.email,
            "address": "Masked Address" if is_analyst else patient.address,
            "emergency_contact": "Masked" if is_analyst else patient.emergency_contact,
            "is_active": patient.is_active,
            "created_at": patient.created_at
        },
        "encounters": enc_data,
        "admissions": adm_data
    }

@router.post("/", status_code=status.HTTP_201_CREATED)
def register_patient(
    req: PatientCreate,
    current_user: User = Depends(clinical_writers),
    db: Session = Depends(get_operational_db)
):
    # Auto-generate next Patient ID reliably
    from sqlalchemy import text
    from datetime import date
    max_id_val = db.execute(text("SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) FROM patients WHERE id LIKE 'PAT-%'")).scalar()
    next_num = (max_id_val + 1) if max_id_val else 1001
    new_id = f"PAT-{next_num}"
    
    # Calculate age from date_of_birth if not provided
    calculated_age = req.age
    if (calculated_age is None or calculated_age <= 0) and req.date_of_birth:
        today = date.today()
        dob = req.date_of_birth
        calculated_age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    if calculated_age is None:
        calculated_age = 0

    new_patient = Patient(
        id=new_id,
        full_name=req.full_name.strip(),
        date_of_birth=req.date_of_birth,
        age=calculated_age,
        sex=req.sex,
        phone_number=req.phone_number,
        email=req.email,
        address=req.address,
        emergency_contact=req.emergency_contact,
        is_active=True
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    
    log_audit_event(db, current_user, "PATIENT_REGISTERED", "patients", f"Created patient record {new_id}")
    return {"message": "Patient registered successfully.", "patient_id": new_id}

@router.put("/{patient_id}")
def update_patient(
    patient_id: str,
    req: PatientUpdate,
    current_user: User = Depends(clinical_writers),
    db: Session = Depends(get_operational_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
        
    if req.full_name is not None:
        patient.full_name = req.full_name.strip()
    if req.phone_number is not None:
        patient.phone_number = req.phone_number.strip()
    if req.email is not None:
        patient.email = req.email.strip()
    if req.address is not None:
        patient.address = req.address.strip()
    if req.emergency_contact is not None:
        patient.emergency_contact = req.emergency_contact.strip()
    if req.is_active is not None:
        patient.is_active = req.is_active
        
    db.commit()
    log_audit_event(db, current_user, "PATIENT_UPDATED", "patients", f"Updated details for patient {patient_id}")
    return {"message": "Patient updated successfully."}

@router.delete("/{patient_id}")
def deactivate_patient(
    patient_id: str,
    current_user: User = Depends(clinical_writers),
    db: Session = Depends(get_operational_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found.")
        
    # Soft deactivation rather than permanent deletion
    patient.is_active = False
    db.commit()
    
    log_audit_event(db, current_user, "PATIENT_DEACTIVATED", "patients", f"Deactivated patient record {patient_id}")
    return {"message": "Patient deactivated successfully."}
