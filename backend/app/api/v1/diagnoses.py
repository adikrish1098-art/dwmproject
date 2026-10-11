from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, func

from app.core.database import get_operational_db
from app.models.operational import Encounter, Diagnosis, Treatment, Patient, Doctor, Department, User, UserRole
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/clinical-records", tags=["Diagnoses & Clinical Encounters"])

clinical_viewers = require_roles(["Administrator", "Doctor", "Receptionist", "Data Analyst"])
clinical_writers = require_roles(["Administrator", "Doctor"])

@router.get("/encounters")
def list_encounters(
    patient_id: Optional[str] = None,
    department_id: Optional[str] = None,
    encounter_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(clinical_viewers),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Encounter)
    if patient_id:
        query = query.filter(Encounter.patient_id == patient_id)
    if department_id:
        query = query.filter(Encounter.department_id == department_id)
    if encounter_type:
        query = query.filter(Encounter.encounter_type == encounter_type)
        
    total = query.count()
    encounters = query.order_by(Encounter.encounter_date.desc()).offset(skip).limit(limit).all()
    
    is_analyst = (current_user.role == UserRole.DATA_ANALYST.value)
    
    res = []
    for enc in encounters:
        res.append({
            "id": enc.id,
            "patient_id": enc.patient_id,
            "patient_name": f"De-identified ({enc.patient_id})" if is_analyst else (enc.patient.full_name if enc.patient else "Unknown"),
            "doctor_id": enc.doctor_id,
            "doctor_name": enc.doctor.name if enc.doctor else "Unknown",
            "department_id": enc.department_id,
            "department_name": enc.department.name if enc.department else "General",
            "encounter_date": enc.encounter_date.isoformat(),
            "encounter_type": enc.encounter_type,
            "notes": "De-identified notes" if is_analyst else enc.notes,
            "diagnoses": [
                {
                    "id": d.id,
                    "code": d.diagnosis_code,
                    "category": d.diagnosis_category,
                    "description": d.description,
                    "is_primary": d.is_primary
                } for d in enc.diagnoses
            ],
            "treatments": [
                {
                    "id": t.id,
                    "procedure_name": t.procedure_name,
                    "category": t.procedure_category,
                    "cost": t.cost,
                    "performed_date": t.performed_date.isoformat()
                } for t in enc.treatments
            ]
        })
        
    return {"total": total, "encounters": res}

@router.get("/diagnoses")
def list_diagnoses(
    search: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(clinical_viewers),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Diagnosis)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(Diagnosis.diagnosis_code.ilike(s), Diagnosis.description.ilike(s), Diagnosis.diagnosis_category.ilike(s)))
    if category:
        query = query.filter(Diagnosis.diagnosis_category == category)
        
    total = query.count()
    diagnoses = query.order_by(Diagnosis.id.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "diagnoses": [
            {
                "id": d.id,
                "encounter_id": d.encounter_id,
                "patient_id": d.patient_id,
                "code": d.diagnosis_code,
                "category": d.diagnosis_category,
                "description": d.description,
                "is_primary": d.is_primary,
                "created_at": d.created_at.isoformat() if d.created_at else None
            }
            for d in diagnoses
        ]
    }

@router.get("/diagnoses/categories-summary")
def get_diagnosis_categories_summary(
    current_user: User = Depends(clinical_viewers),
    db: Session = Depends(get_operational_db)
):
    results = db.query(
        Diagnosis.diagnosis_category,
        func.count(Diagnosis.id).label("count")
    ).group_by(Diagnosis.diagnosis_category).order_by(func.count(Diagnosis.id).desc()).all()
    
    return [
        {"category": r[0], "count": r[1]}
        for r in results
    ]

@router.get("/treatments")
def list_treatments(
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(clinical_viewers),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Treatment)
    if category:
        query = query.filter(Treatment.procedure_category == category)
        
    total = query.count()
    treatments = query.order_by(Treatment.id.desc()).offset(skip).limit(limit).all()
    
    return {
        "total": total,
        "treatments": [
            {
                "id": t.id,
                "encounter_id": t.encounter_id,
                "procedure_name": t.procedure_name,
                "category": t.procedure_category,
                "cost": t.cost,
                "performed_date": t.performed_date.isoformat()
            }
            for t in treatments
        ]
    }

@router.post("/encounters", status_code=status.HTTP_201_CREATED)
def create_encounter(
    data: dict,
    current_user: User = Depends(clinical_writers),
    db: Session = Depends(get_operational_db)
):
    patient_id = data.get("patient_id")
    doctor_id = data.get("doctor_id")
    department_id = data.get("department_id")
    encounter_type = data.get("encounter_type", "Outpatient")
    notes = data.get("notes", "")
    diagnoses_list = data.get("diagnoses", [])
    treatments_list = data.get("treatments", [])
    
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient record not found.")
        
    # Auto-generate next Encounter ID
    last_enc = db.query(Encounter).order_by(Encounter.id.desc()).first()
    next_num = int(last_enc.id.split("-")[1]) + 1 if last_enc and "-" in last_enc.id else 9001
    enc_id = f"ENC-{next_num}"
    
    enc = Encounter(
        id=enc_id,
        patient_id=patient_id,
        doctor_id=doctor_id,
        department_id=department_id,
        encounter_date=datetime.now(timezone.utc),
        encounter_type=encounter_type,
        notes=notes
    )
    db.add(enc)
    db.flush()
    
    for diag in diagnoses_list:
        d = Diagnosis(
            encounter_id=enc_id,
            patient_id=patient_id,
            diagnosis_code=diag.get("code", "I10"),
            diagnosis_category=diag.get("category", "General"),
            description=diag.get("description", "Clinical observation"),
            is_primary=diag.get("is_primary", True)
        )
        db.add(d)
        
    for trt in treatments_list:
        t = Treatment(
            encounter_id=enc_id,
            procedure_name=trt.get("procedure_name", "Consultation"),
            procedure_category=trt.get("category", "General Evaluation"),
            cost=float(trt.get("cost", 100.0)),
            performed_date=datetime.now(timezone.utc)
        )
        db.add(t)
        
    db.commit()
    log_audit_event(db, current_user, "ENCOUNTER_CREATED", "clinical-records", f"Created encounter {enc_id}")
    return {"message": "Encounter created successfully", "encounter_id": enc_id}
