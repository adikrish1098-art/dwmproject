import time
from datetime import datetime, date, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import OperationalSessionLocal, WarehouseSessionLocal
from app.models.operational import (
    Patient, Doctor, Department, Encounter, Admission, Diagnosis, Invoice
)
from app.models.warehouse import (
    DimDate, DimPatient, DimDoctor, DimDepartment, DimDiagnosis, DimEncounter,
    FactPatientVisit, FactAdmission, FactBilling, ETLJob
)

def get_age_group(age: int) -> str:
    if age <= 18:
        return "0-18 (Pediatric)"
    elif age <= 35:
        return "19-35 (Young Adult)"
    elif age <= 50:
        return "36-50 (Adult)"
    elif age <= 65:
        return "51-65 (Middle Aged)"
    else:
        return "65+ (Senior/Geriatric)"

def date_to_key(dt: datetime) -> int:
    if not dt:
        return 0
    return dt.year * 10000 + dt.month * 100 + dt.day

def populate_dim_date(warehouse_db: Session, min_year: int = 2024, max_year: int = 2027):
    """Generate calendar dates for DimDate if not already present."""
    from datetime import date, timedelta
    start_dt = date(min_year, 1, 1)
    end_dt = date(max_year, 12, 31)
    cur = start_dt
    
    existing_keys = set(r[0] for r in warehouse_db.query(DimDate.date_key).all())
    dates_to_add = []
    
    while cur <= end_dt:
        d_key = cur.year * 10000 + cur.month * 100 + cur.day
        if d_key not in existing_keys:
            weekday_name = cur.strftime("%A")
            is_wknd = cur.weekday() in (5, 6)
            quarter = (cur.month - 1) // 3 + 1
            dates_to_add.append(
                DimDate(
                    date_key=d_key,
                    full_date=cur,
                    day=cur.day,
                    month=cur.month,
                    quarter=quarter,
                    year=cur.year,
                    weekday=weekday_name,
                    is_weekend=is_wknd
                )
            )
        cur += timedelta(days=1)
    
    if dates_to_add:
        warehouse_db.add_all(dates_to_add)
        warehouse_db.commit()

def run_etl_pipeline() -> dict:
    """
    Executes complete ETL pipeline:
    Extract from operational OLTP -> Transform (cleansing, surrogate keying, SCD1) -> Load into Star Schema.
    Idempotent and atomic.
    """
    start_time = time.time()
    op_db = OperationalSessionLocal()
    wh_db = WarehouseSessionLocal()
    
    job = ETLJob(
        job_name="Hospital_Star_Schema_Refresh",
        status="RUNNING",
        started_at=datetime.now(timezone.utc)
    )
    wh_db.add(job)
    wh_db.commit()
    
    records_extracted = 0
    records_loaded = 0
    error_count = 0
    error_log = []

    try:
        # Step 0: Ensure Date Dimension is populated
        populate_dim_date(wh_db)

        # ---------------------------------------------
        # STEP 1: DIMENSIONS (Type 1 SCD Upsert/Insert)
        # ---------------------------------------------
        
        # DimDepartment
        departments = op_db.query(Department).all()
        records_extracted += len(departments)
        existing_depts = {d.source_department_id: d for d in wh_db.query(DimDepartment).all()}
        for dept in departments:
            if dept.id in existing_depts:
                existing_depts[dept.id].department_name = dept.name
                existing_depts[dept.id].last_updated = datetime.now(timezone.utc)
            else:
                new_dept = DimDepartment(
                    source_department_id=dept.id,
                    department_name=dept.name
                )
                wh_db.add(new_dept)
                records_loaded += 1
        wh_db.commit()
        dept_lookup = {d.source_department_id: d.department_key for d in wh_db.query(DimDepartment).all()}

        # DimDoctor
        doctors = op_db.query(Doctor).all()
        records_extracted += len(doctors)
        existing_docs = {d.source_doctor_id: d for d in wh_db.query(DimDoctor).all()}
        for doc in doctors:
            dept_name = doc.department.name if doc.department else "General"
            if doc.id in existing_docs:
                existing_docs[doc.id].doctor_name = doc.name
                existing_docs[doc.id].specialty = doc.specialty
                existing_docs[doc.id].department_name = dept_name
                existing_docs[doc.id].last_updated = datetime.now(timezone.utc)
            else:
                new_doc = DimDoctor(
                    source_doctor_id=doc.id,
                    doctor_name=doc.name,
                    specialty=doc.specialty,
                    department_name=dept_name
                )
                wh_db.add(new_doc)
                records_loaded += 1
        wh_db.commit()
        doc_lookup = {d.source_doctor_id: d.doctor_key for d in wh_db.query(DimDoctor).all()}

        # DimPatient
        patients = op_db.query(Patient).all()
        records_extracted += len(patients)
        existing_pats = {p.source_patient_id: p for p in wh_db.query(DimPatient).all()}
        for pat in patients:
            age_grp = get_age_group(pat.age)
            reg_year = pat.created_at.year if pat.created_at else 2025
            if pat.id in existing_pats:
                existing_pats[pat.id].age_group = age_grp
                existing_pats[pat.id].sex = pat.sex
                existing_pats[pat.id].last_updated = datetime.now(timezone.utc)
            else:
                new_pat = DimPatient(
                    source_patient_id=pat.id,
                    age_group=age_grp,
                    sex=pat.sex,
                    registration_year=reg_year
                )
                wh_db.add(new_pat)
                records_loaded += 1
        wh_db.commit()
        pat_lookup = {p.source_patient_id: p.patient_key for p in wh_db.query(DimPatient).all()}

        # DimDiagnosis
        diagnoses = op_db.query(Diagnosis).all()
        records_extracted += len(diagnoses)
        existing_diags = {d.diagnosis_code: d for d in wh_db.query(DimDiagnosis).all()}
        for diag in diagnoses:
            if diag.diagnosis_code not in existing_diags:
                new_diag = DimDiagnosis(
                    diagnosis_code=diag.diagnosis_code,
                    diagnosis_category=diag.diagnosis_category,
                    diagnosis_description=diag.description
                )
                wh_db.add(new_diag)
                existing_diags[diag.diagnosis_code] = new_diag
                records_loaded += 1
        wh_db.commit()
        diag_lookup = {d.diagnosis_code: d.diagnosis_key for d in wh_db.query(DimDiagnosis).all()}

        # DimEncounter
        encounters = op_db.query(Encounter).all()
        records_extracted += len(encounters)
        existing_encs = {e.source_encounter_id: e for e in wh_db.query(DimEncounter).all()}
        for enc in encounters:
            if enc.id not in existing_encs:
                new_enc = DimEncounter(
                    source_encounter_id=enc.id,
                    encounter_type=enc.encounter_type
                )
                wh_db.add(new_enc)
                existing_encs[enc.id] = new_enc
                records_loaded += 1
        wh_db.commit()
        enc_lookup = {e.source_encounter_id: e.encounter_key for e in wh_db.query(DimEncounter).all()}

        # ---------------------------------------------
        # STEP 2: FACT TABLES (Idempotent Load)
        # ---------------------------------------------

        # FactPatientVisit
        existing_visit_encs = set(r[0] for r in wh_db.query(FactPatientVisit.source_encounter_id).all())
        fact_visits_to_add = []
        for enc in encounters:
            if enc.id not in existing_visit_encs:
                p_key = pat_lookup.get(enc.patient_id)
                d_key = doc_lookup.get(enc.doctor_id)
                dept_key = dept_lookup.get(enc.department_id)
                e_key = enc_lookup.get(enc.id)
                dt_key = date_to_key(enc.encounter_date)
                
                # Primary diagnosis or default
                diag_code = enc.diagnoses[0].diagnosis_code if enc.diagnoses else "I10"
                diag_key = diag_lookup.get(diag_code, list(diag_lookup.values())[0])
                
                if p_key and d_key and dept_key and e_key:
                    fact_visits_to_add.append(
                        FactPatientVisit(
                            patient_key=p_key,
                            doctor_key=d_key,
                            department_key=dept_key,
                            diagnosis_key=diag_key,
                            date_key=dt_key,
                            encounter_key=e_key,
                            source_encounter_id=enc.id,
                            visit_count=1
                        )
                    )
        if fact_visits_to_add:
            wh_db.add_all(fact_visits_to_add)
            records_loaded += len(fact_visits_to_add)
        wh_db.commit()

        # FactAdmission
        admissions = op_db.query(Admission).all()
        records_extracted += len(admissions)
        existing_adms = set(r[0] for r in wh_db.query(FactAdmission.source_admission_id).all())
        fact_adms_to_add = []
        for adm in admissions:
            if adm.id not in existing_adms:
                p_key = pat_lookup.get(adm.patient_id)
                d_key = doc_lookup.get(adm.doctor_id)
                dept_key = dept_lookup.get(adm.department_id)
                e_key = enc_lookup.get(adm.encounter_id) if adm.encounter_id else None
                # If admission doesn't have an encounter or not found, use first encounter
                if not e_key and enc_lookup:
                    e_key = list(enc_lookup.values())[0]
                
                adm_dt_key = date_to_key(adm.admission_date)
                disch_dt_key = date_to_key(adm.discharge_date) if adm.discharge_date else adm_dt_key
                
                if p_key and d_key and dept_key and e_key:
                    fact_adms_to_add.append(
                        FactAdmission(
                            patient_key=p_key,
                            doctor_key=d_key,
                            department_key=dept_key,
                            date_key=adm_dt_key,
                            discharge_date_key=disch_dt_key,
                            encounter_key=e_key,
                            source_admission_id=adm.id,
                            length_of_stay=adm.length_of_stay,
                            readmission_within_30_days=1 if adm.is_readmission_30d else 0
                        )
                    )
        if fact_adms_to_add:
            wh_db.add_all(fact_adms_to_add)
            records_loaded += len(fact_adms_to_add)
        wh_db.commit()

        # FactBilling
        invoices = op_db.query(Invoice).all()
        records_extracted += len(invoices)
        existing_invs = set(r[0] for r in wh_db.query(FactBilling.source_invoice_id).all())
        fact_bills_to_add = []
        for inv in invoices:
            if inv.id not in existing_invs:
                p_key = pat_lookup.get(inv.patient_id)
                dept_key = dept_lookup.get(inv.department_id)
                e_key = enc_lookup.get(inv.encounter_id) if inv.encounter_id else list(enc_lookup.values())[0]
                inv_dt_key = date_to_key(inv.invoice_date)
                
                if p_key and dept_key and e_key:
                    fact_bills_to_add.append(
                        FactBilling(
                            patient_key=p_key,
                            department_key=dept_key,
                            date_key=inv_dt_key,
                            encounter_key=e_key,
                            source_invoice_id=inv.id,
                            amount_billed=inv.amount_billed,
                            amount_paid=inv.amount_paid,
                            outstanding_amount=inv.outstanding_balance
                        )
                    )
        if fact_bills_to_add:
            wh_db.add_all(fact_bills_to_add)
            records_loaded += len(fact_bills_to_add)
        wh_db.commit()

        # Update job success
        exec_duration = round(time.time() - start_time, 2)
        job.status = "SUCCESS"
        job.records_extracted = records_extracted
        job.records_loaded = records_loaded
        job.error_count = error_count
        job.completed_at = datetime.now(timezone.utc)
        job.execution_time_seconds = exec_duration
        wh_db.commit()

        return {
            "status": "SUCCESS",
            "job_id": job.id,
            "records_extracted": records_extracted,
            "records_loaded": records_loaded,
            "error_count": error_count,
            "execution_time_seconds": exec_duration
        }

    except Exception as e:
        wh_db.rollback()
        exec_duration = round(time.time() - start_time, 2)
        job.status = "FAILED"
        job.error_count = 1
        job.error_log = str(e)
        job.completed_at = datetime.now(timezone.utc)
        job.execution_time_seconds = exec_duration
        wh_db.commit()
        return {
            "status": "FAILED",
            "job_id": job.id,
            "error": str(e),
            "execution_time_seconds": exec_duration
        }
    finally:
        op_db.close()
        wh_db.close()
