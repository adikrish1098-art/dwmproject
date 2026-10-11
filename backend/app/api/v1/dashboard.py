from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.core.database import get_operational_db, get_warehouse_db
from app.models.operational import (
    Patient, Doctor, Department, Appointment, Admission, Invoice, Payment, AuditLog, User
)
from app.models.warehouse import ETLJob, FactAdmission, FactPatientVisit, FactBilling, DimDate
from app.api.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("")
@router.get("/")
@router.get("/overview")
def get_dashboard_overview(
    department_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    op_db: Session = Depends(get_operational_db),
    wh_db: Session = Depends(get_warehouse_db)
):
    """
    Computes all hospital management and warehouse KPIs dynamically from database queries.
    Supports department and date-range filtering.
    """
    # 1. High-Level Hospital Management KPIs
    total_patients = op_db.query(Patient).filter(Patient.is_active == True).count()
    total_doctors = op_db.query(Doctor).filter(Doctor.is_active == True).count()
    total_departments = op_db.query(Department).filter(Department.is_active == True).count()
    
    appt_query = op_db.query(Appointment)
    adm_query = op_db.query(Admission)
    inv_query = op_db.query(Invoice)
    
    if department_id:
        appt_query = appt_query.filter(Appointment.department_id == department_id)
        adm_query = adm_query.filter(Admission.department_id == department_id)
        inv_query = inv_query.filter(Invoice.department_id == department_id)
        
    if start_date:
        try:
            start_dt = datetime.fromisoformat(start_date)
            adm_query = adm_query.filter(Admission.admission_date >= start_dt)
            appt_query = appt_query.filter(Appointment.appointment_date >= start_dt)
            inv_query = inv_query.filter(Invoice.invoice_date >= start_dt)
        except Exception:
            pass
            
    if end_date:
        try:
            end_dt = datetime.fromisoformat(end_date)
            adm_query = adm_query.filter(Admission.admission_date <= end_dt)
            appt_query = appt_query.filter(Appointment.appointment_date <= end_dt)
            inv_query = inv_query.filter(Invoice.invoice_date <= end_dt)
        except Exception:
            pass
            
    total_appointments = appt_query.count()
    total_admissions = adm_query.count()
    
    discharged_count = adm_query.filter(Admission.discharge_date.isnot(None)).count()
    readmission_count = adm_query.filter(Admission.is_readmission_30d == True).count()
    readmission_rate = round((readmission_count / total_admissions * 100), 1) if total_admissions > 0 else 0.0
    
    avg_los = op_db.query(func.avg(Admission.length_of_stay)).scalar() or 0.0
    avg_los = round(float(avg_los), 1)
    
    # Financial KPIs
    inv_query = op_db.query(Invoice)
    if department_id:
        inv_query = inv_query.filter(Invoice.department_id == department_id)
    total_billed = inv_query.with_entities(func.sum(Invoice.amount_billed)).scalar() or 0.0
    total_paid = inv_query.with_entities(func.sum(Invoice.amount_paid)).scalar() or 0.0
    total_outstanding = inv_query.with_entities(func.sum(Invoice.outstanding_balance)).scalar() or 0.0
    
    # 2. Charts Data
    
    # Monthly Admissions Trend
    monthly_adm_sql = text("""
        SELECT strftime('%Y-%m', admission_date) as yr_mo, COUNT(*) as admissions
        FROM admissions
        GROUP BY yr_mo
        ORDER BY yr_mo ASC
        LIMIT 12;
    """)
    monthly_adms = [
        {"period": str(r[0]), "admissions": int(r[1])}
        for r in op_db.execute(monthly_adm_sql).fetchall()
    ]
    
    # Department-wise Patient Distribution
    dept_dist_sql = text("""
        SELECT dep.name, COUNT(a.id) as admissions_count
        FROM departments dep
        LEFT JOIN admissions a ON dep.id = a.department_id
        GROUP BY dep.name
        ORDER BY admissions_count DESC;
    """)
    dept_distribution = [
        {"department": str(r[0]), "count": int(r[1])}
        for r in op_db.execute(dept_dist_sql).fetchall()
    ]
    
    # Common Diagnosis Categories
    diag_sql = text("""
        SELECT diagnosis_category, COUNT(*) as count
        FROM diagnoses
        GROUP BY diagnosis_category
        ORDER BY count DESC
        LIMIT 8;
    """)
    top_diagnoses = [
        {"category": str(r[0]), "count": int(r[1])}
        for r in op_db.execute(diag_sql).fetchall()
    ]
    
    # Appointment Status Distribution
    appt_status_sql = text("""
        SELECT status, COUNT(*) as count
        FROM appointments
        GROUP BY status;
    """)
    appt_status_distribution = [
        {"status": str(r[0]), "count": int(r[1])}
        for r in op_db.execute(appt_status_sql).fetchall()
    ]
    
    # Billing vs Collections Monthly Trend
    billing_trend_sql = text("""
        SELECT strftime('%Y-%m', invoice_date) as yr_mo, 
               ROUND(SUM(amount_billed), 2) as billed,
               ROUND(SUM(amount_paid), 2) as paid
        FROM invoices
        GROUP BY yr_mo
        ORDER BY yr_mo ASC
        LIMIT 12;
    """)
    billing_trends = [
        {"period": str(r[0]), "billed": float(r[1] or 0), "paid": float(r[2] or 0)}
        for r in op_db.execute(billing_trend_sql).fetchall()
    ]
    
    # Age Group Distribution
    age_dist_sql = text("""
        SELECT 
            CASE 
                WHEN age <= 18 THEN '0-18 (Pediatric)'
                WHEN age <= 35 THEN '19-35 (Young Adult)'
                WHEN age <= 50 THEN '36-50 (Adult)'
                WHEN age <= 65 THEN '51-65 (Middle Aged)'
                ELSE '65+ (Senior)'
            END as age_bucket,
            COUNT(*) as count
        FROM patients
        GROUP BY age_bucket
        ORDER BY count DESC;
    """)
    age_groups = [
        {"age_group": str(r[0]), "count": int(r[1])}
        for r in op_db.execute(age_dist_sql).fetchall()
    ]
    
    # Recent Appointments
    recent_appts = op_db.query(Appointment).order_by(Appointment.appointment_date.desc()).limit(5).all()
    recent_appts_data = [
        {
            "id": a.id,
            "patient_name": a.patient.full_name if a.patient else "Unknown",
            "doctor_name": a.doctor.name if a.doctor else "Unknown",
            "department_name": a.department.name if a.department else "General",
            "date": a.appointment_date.strftime("%b %d, %Y %H:%M"),
            "status": a.status
        }
        for a in recent_appts
    ]
    
    # Recent Audit Activity
    recent_activity = op_db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(5).all()
    recent_activity_data = [
        {
            "id": log.id,
            "username": log.username,
            "action": log.action,
            "details": log.details,
            "timestamp": log.timestamp.strftime("%b %d, %H:%M")
        }
        for log in recent_activity
    ]
    
    # ETL Freshness Status
    last_etl = wh_db.query(ETLJob).order_by(ETLJob.id.desc()).first()
    etl_status = {
        "last_refresh": last_etl.completed_at.strftime("%Y-%m-%d %H:%M UTC") if (last_etl and last_etl.completed_at) else "Never",
        "last_status": last_etl.status if last_etl else "NO_RUNS",
        "records_loaded": last_etl.records_loaded if last_etl else 0
    }
    
    return {
        "kpis": {
            "total_patients": total_patients,
            "total_doctors": total_doctors,
            "total_departments": total_departments,
            "total_appointments": total_appointments,
            "total_admissions": total_admissions,
            "discharged_count": discharged_count,
            "readmission_count": readmission_count,
            "readmission_rate_pct": readmission_rate,
            "avg_length_of_stay": avg_los,
            "total_billed": round(float(total_billed), 2),
            "total_paid": round(float(total_paid), 2),
            "total_outstanding": round(float(total_outstanding), 2)
        },
        "charts": {
            "monthly_admissions": monthly_adms,
            "department_distribution": dept_distribution,
            "top_diagnoses": top_diagnoses,
            "appointment_status": appt_status_distribution,
            "billing_trends": billing_trends,
            "age_groups": age_groups
        },
        "recent_appointments": recent_appts_data,
        "recent_activity": recent_activity_data,
        "etl_freshness": etl_status
    }
