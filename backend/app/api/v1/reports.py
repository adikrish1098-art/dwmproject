import csv
import io
from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text

from app.core.database import get_operational_db, get_warehouse_db
from app.models.operational import Patient, Admission, Invoice, Department, Encounter, Diagnosis, Treatment, User
from app.models.warehouse import (
    FactAdmission, FactBilling, FactPatientVisit, DimDepartment, DimDate, DimPatient, DimDiagnosis, ETLJob
)
from app.mining.clustering import run_kmeans_clustering
from app.mining.apriori import run_apriori_mining
from app.ml.readmission import train_and_evaluate_readmission_models
from app.ml.decision_tree import train_and_evaluate_decision_tree
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/reports", tags=["Reports & Analytical Exports"])

# Administrator, Doctor, and Data Analyst can access reports
report_viewers = require_roles(["Administrator", "Doctor", "Data Analyst"])

# ==============================================================================
# 1. STANDARDIZED EXECUTIVE & MODULAR REPORTS (SECTION 21)
# ==============================================================================

@router.get("/summary")
def get_executive_report_summary(
    current_user: User = Depends(report_viewers),
    op_db: Session = Depends(get_operational_db),
    wh_db: Session = Depends(get_warehouse_db)
):
    total_patients = op_db.query(Patient).count()
    total_admissions = op_db.query(Admission).count()
    readmission_count = op_db.query(Admission).filter(Admission.is_readmission_30d == True).count()
    total_billed = op_db.query(func.sum(Invoice.amount_billed)).scalar() or 0.0
    total_paid = op_db.query(func.sum(Invoice.amount_paid)).scalar() or 0.0
    
    return {
        "report_title": "Hospital Operational & Analytical Executive Intelligence Summary",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "dataset_version": "Synthetic College Demonstration v1.0",
        "data_disclosure": "Contains synthetic data generated for educational and curriculum demonstrations. Not clinical records.",
        "kpis": {
            "registered_patients": total_patients,
            "total_admissions": total_admissions,
            "readmissions_30d": readmission_count,
            "readmission_rate_pct": round((readmission_count / total_admissions * 100), 2) if total_admissions > 0 else 0.0,
            "total_billed": round(float(total_billed), 2),
            "total_collected": round(float(total_paid), 2),
            "outstanding_balance": round(float(total_billed - total_paid), 2)
        }
    }

@router.get("/hospital-kpi")
def get_hospital_kpi_report(
    department_id: Optional[str] = None,
    current_user: User = Depends(report_viewers),
    op_db: Session = Depends(get_operational_db)
):
    """1. Hospital KPI Report with optional department filtering."""
    q_adm = op_db.query(Admission)
    q_inv = op_db.query(Invoice)
    if department_id:
        q_adm = q_adm.filter(Admission.department_id == department_id)
        q_inv = q_inv.filter(Invoice.department_id == department_id)
        
    total_admissions = q_adm.count()
    discharges = q_adm.filter(Admission.discharge_date.isnot(None)).count()
    readmissions = q_adm.filter(Admission.is_readmission_30d == True).count()
    avg_los = q_adm.with_entities(func.avg(Admission.length_of_stay)).scalar() or 0.0
    
    billed = q_inv.with_entities(func.sum(Invoice.amount_billed)).scalar() or 0.0
    paid = q_inv.with_entities(func.sum(Invoice.amount_paid)).scalar() or 0.0
    outstanding = q_inv.with_entities(func.sum(Invoice.outstanding_balance)).scalar() or 0.0
    
    return {
        "report_type": "Hospital KPI Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "department_filter": department_id or "All Departments",
        "metrics": {
            "total_admissions": total_admissions,
            "total_discharges": discharges,
            "readmissions_30d": readmissions,
            "readmission_rate_pct": round((readmissions / total_admissions * 100), 2) if total_admissions > 0 else 0.0,
            "average_length_of_stay": round(float(avg_los), 1),
            "total_billed": round(float(billed), 2),
            "total_collected": round(float(paid), 2),
            "total_outstanding": round(float(outstanding), 2),
            "collection_efficiency_pct": round((paid / billed * 100), 1) if billed > 0 else 0.0
        }
    }

@router.get("/department-performance")
def get_department_performance_report(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    """2. Department Performance Report."""
    sql = text("""
        SELECT 
            dep.department_name,
            COUNT(f.admission_key) as total_admissions,
            ROUND(AVG(f.length_of_stay), 1) as avg_los,
            SUM(f.readmission_within_30_days) as readmission_count,
            ROUND((CAST(SUM(f.readmission_within_30_days) AS FLOAT) / COUNT(f.admission_key)) * 100, 1) as readmission_rate_pct
        FROM fact_admission f
        JOIN dim_department dep ON f.department_key = dep.department_key
        GROUP BY dep.department_name
        ORDER BY total_admissions DESC;
    """)
    rows = wh_db.execute(sql).fetchall()
    return {
        "report_type": "Department Performance Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "departments": [
            {
                "department": r[0],
                "admissions": int(r[1]),
                "avg_los": float(r[2] or 0.0),
                "readmissions": int(r[3] or 0),
                "readmission_rate_pct": float(r[4] or 0.0)
            }
            for r in rows
        ]
    }

@router.get("/monthly-admissions")
def get_monthly_admissions_report(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    """3. Monthly Admissions & Readmissions Trend Report."""
    sql = text("""
        SELECT 
            d.year, d.month,
            COUNT(f.admission_key) as admissions,
            SUM(f.readmission_within_30_days) as readmissions,
            ROUND(AVG(f.length_of_stay), 1) as avg_los
        FROM fact_admission f
        JOIN dim_date d ON f.date_key = d.date_key
        GROUP BY d.year, d.month
        ORDER BY d.year ASC, d.month ASC;
    """)
    rows = wh_db.execute(sql).fetchall()
    return {
        "report_type": "Monthly Admissions Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "monthly_data": [
            {
                "period": f"{r[0]}-{r[1]:02d}",
                "admissions": int(r[2]),
                "readmissions": int(r[3] or 0),
                "avg_los": float(r[4] or 0.0)
            }
            for r in rows
        ]
    }

@router.get("/billing-collection")
def get_billing_collection_report(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    """4. Billing & Collection Revenue Cycle Report."""
    sql = text("""
        SELECT 
            dep.department_name,
            ROUND(SUM(b.amount_billed), 2) as billed,
            ROUND(SUM(b.amount_paid), 2) as collected,
            ROUND(SUM(b.outstanding_amount), 2) as outstanding,
            ROUND((SUM(b.amount_paid) / SUM(b.amount_billed)) * 100, 1) as collection_pct
        FROM fact_billing b
        JOIN dim_department dep ON b.department_key = dep.department_key
        GROUP BY dep.department_name
        ORDER BY billed DESC;
    """)
    rows = wh_db.execute(sql).fetchall()
    return {
        "report_type": "Billing and Collection Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "department_billing": [
            {
                "department": r[0],
                "billed": float(r[1] or 0.0),
                "collected": float(r[2] or 0.0),
                "outstanding": float(r[3] or 0.0),
                "collection_rate_pct": float(r[4] or 0.0)
            }
            for r in rows
        ]
    }

@router.get("/readmission-analysis")
def get_readmission_analysis_report(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    """5. Readmission Analysis Report by Age Group and Length of Stay."""
    sql = text("""
        SELECT 
            p.age_group,
            COUNT(f.admission_key) as total_admissions,
            SUM(f.readmission_within_30_days) as readmissions,
            ROUND((CAST(SUM(f.readmission_within_30_days) AS FLOAT) / COUNT(f.admission_key)) * 100, 1) as rate_pct
        FROM fact_admission f
        JOIN dim_patient p ON f.patient_key = p.patient_key
        GROUP BY p.age_group
        ORDER BY rate_pct DESC;
    """)
    rows = wh_db.execute(sql).fetchall()
    return {
        "report_type": "Readmission Analysis Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "age_group_analysis": [
            {
                "age_group": r[0],
                "admissions": int(r[1]),
                "readmissions": int(r[2] or 0),
                "readmission_rate_pct": float(r[3] or 0.0)
            }
            for r in rows
        ]
    }

@router.get("/clustering-summary")
def get_clustering_report(current_user: User = Depends(report_viewers)):
    """6. Patient Clustering Analytical Report."""
    res = run_kmeans_clustering(k=3)
    return {
        "report_type": "Patient Clustering Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "silhouette_score": res.get("overall_silhouette_score"),
        "cluster_profiles": res.get("cluster_profiles", [])
    }

@router.get("/association-rules-summary")
def get_association_rules_report(current_user: User = Depends(report_viewers)):
    """7. Association Rule Mining Report."""
    res = run_apriori_mining(min_support=0.02, min_confidence=0.20, min_lift=1.0)
    return {
        "report_type": "Association Rule Mining Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "rules_count": res.get("rules_count", 0),
        "frequent_itemsets_count": res.get("frequent_itemsets_count", 0),
        "top_rules": res.get("rules", [])[:10]
    }

@router.get("/model-evaluation-summary")
def get_model_evaluation_report(current_user: User = Depends(report_viewers)):
    """8. Predictive Model Evaluation Report."""
    res = train_and_evaluate_readmission_models()
    dt_res = train_and_evaluate_decision_tree(max_depth=4)
    
    models = res.get("model_results", {})
    return {
        "report_type": "Model Evaluation Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "models": models,
        "decision_tree": dt_res.get("metrics", {}),
        "feature_importances": res.get("feature_importances", [])
    }

@router.get("/etl-quality")
def get_etl_quality_report(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    """9. ETL Data Quality and Pipeline Health Report."""
    jobs = wh_db.query(ETLJob).order_by(ETLJob.id.desc()).limit(10).all()
    dim_pat_cnt = wh_db.query(DimPatient).count()
    fact_adm_cnt = wh_db.query(FactAdmission).count()
    fact_bill_cnt = wh_db.query(FactBilling).count()
    
    return {
        "report_type": "ETL Quality Report",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "warehouse_tables": {
            "DimPatient": dim_pat_cnt,
            "FactAdmission": fact_adm_cnt,
            "FactBilling": fact_bill_cnt
        },
        "recent_jobs": [
            {
                "id": j.id,
                "status": j.status,
                "records_extracted": j.records_extracted,
                "records_loaded": j.records_loaded,
                "error_count": j.error_count,
                "duration_seconds": j.execution_time_seconds,
                "started_at": j.started_at.isoformat() if j.started_at else None
            }
            for j in jobs
        ]
    }

# ==============================================================================
# 2. CSV EXPORT ENDPOINTS (DE-IDENTIFIED, ROLE RESTRICTED)
# ==============================================================================

@router.get("/export/admissions-csv")
def export_admissions_csv(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db),
    op_db: Session = Depends(get_operational_db)
):
    """Exports de-identified admission records with 30-day readmission status as CSV."""
    adms = wh_db.query(FactAdmission).limit(1000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Admission_Key", "Source_Admission_ID", "Patient_Key", "Department_Key",
        "Admission_Date_Key", "Discharge_Date_Key", "Length_Of_Stay", "Readmission_Within_30_Days"
    ])
    for a in adms:
        writer.writerow([
            a.admission_key, a.source_admission_id, a.patient_key, a.department_key,
            a.date_key, a.discharge_date_key, a.length_of_stay, a.readmission_within_30_days
        ])
    log_audit_event(op_db, current_user, "REPORT_EXPORT_CSV", "reports", "Exported FactAdmission CSV")
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hospital_admissions_warehouse_export.csv"}
    )

@router.get("/export/billing-csv")
def export_billing_csv(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db),
    op_db: Session = Depends(get_operational_db)
):
    """Exports aggregate billing and collection records as CSV."""
    bills = wh_db.query(FactBilling).limit(1000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Billing_Key", "Source_Invoice_ID", "Patient_Key", "Department_Key",
        "Date_Key", "Amount_Billed", "Amount_Paid", "Outstanding_Amount"
    ])
    for b in bills:
        writer.writerow([
            b.billing_key, b.source_invoice_id, b.patient_key, b.department_key,
            b.date_key, b.amount_billed, b.amount_paid, b.outstanding_amount
        ])
    log_audit_event(op_db, current_user, "REPORT_EXPORT_CSV", "reports", "Exported FactBilling CSV")
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hospital_billing_warehouse_export.csv"}
    )

@router.get("/export/patients-csv")
def export_deidentified_patients_csv(
    current_user: User = Depends(report_viewers),
    wh_db: Session = Depends(get_warehouse_db),
    op_db: Session = Depends(get_operational_db)
):
    """Exports HIPAA Safe Harbor de-identified patient demographics as CSV."""
    pats = wh_db.query(DimPatient).limit(1000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Patient_Key", "Deidentified_Patient_ID", "Age_Group", "Sex", "Registration_Year"])
    for p in pats:
        writer.writerow([p.patient_key, f"DEID-{p.patient_key:04d}", p.age_group, p.sex, p.registration_year])
    log_audit_event(op_db, current_user, "REPORT_EXPORT_CSV", "reports", "Exported DimPatient De-identified CSV")
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hospital_patients_deidentified_export.csv"}
    )

@router.get("/export/rules-csv")
def export_association_rules_csv(
    current_user: User = Depends(report_viewers),
    op_db: Session = Depends(get_operational_db)
):
    """Exports Apriori association rules as CSV."""
    res = run_apriori_mining(min_support=0.02, min_confidence=0.15, min_lift=1.0)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Rule_ID", "Antecedent", "Consequent", "Support", "Confidence", "Lift", "Encounters_Count"])
    for r in res.get("rules", []):
        writer.writerow([r["id"], r["antecedent"], r["consequent"], r["support"], r["confidence"], r["lift"], r["supporting_encounters"]])
    log_audit_event(op_db, current_user, "REPORT_EXPORT_CSV", "reports", "Exported Apriori Rules CSV")
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hospital_apriori_association_rules.csv"}
    )
