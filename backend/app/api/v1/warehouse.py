from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_warehouse_db, get_operational_db
from app.models.warehouse import (
    DimPatient, DimDoctor, DimDepartment, DimDiagnosis, DimDate, DimEncounter,
    FactPatientVisit, FactAdmission, FactBilling, ETLJob
)
from app.models.operational import User
from app.etl.pipeline import run_etl_pipeline
from app.warehouse.olap import (
    execute_olap_rollup, execute_olap_drilldown, execute_olap_slice,
    execute_olap_dice, execute_olap_pivot, get_sql_reports_pack
)
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/warehouse", tags=["Data Warehouse & OLAP"])

warehouse_viewers = require_roles(["Administrator", "Data Analyst"])
admin_only = require_roles(["Administrator"])

@router.get("/schema-summary")
def get_warehouse_schema_summary(
    current_user: User = Depends(warehouse_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    """Returns row counts and schema information for star schema dimension and fact tables."""
    return {
        "architecture": "Star Schema (Dimensional Data Warehouse)",
        "database_type": "SQLite Analytical Data Store (Separated Logical Warehouse)",
        "dimensions": {
            "DimPatient": wh_db.query(DimPatient).count(),
            "DimDoctor": wh_db.query(DimDoctor).count(),
            "DimDepartment": wh_db.query(DimDepartment).count(),
            "DimDiagnosis": wh_db.query(DimDiagnosis).count(),
            "DimDate": wh_db.query(DimDate).count(),
            "DimEncounter": wh_db.query(DimEncounter).count(),
        },
        "facts": {
            "FactPatientVisit": wh_db.query(FactPatientVisit).count(),
            "FactAdmission": wh_db.query(FactAdmission).count(),
            "FactBilling": wh_db.query(FactBilling).count(),
        },
        "last_etl_job": wh_db.query(ETLJob).order_by(ETLJob.id.desc()).first()
    }

@router.post("/etl/run")
def trigger_etl_pipeline(
    current_user: User = Depends(warehouse_viewers),
    op_db: Session = Depends(get_operational_db)
):
    """Triggers end-to-end Extract-Transform-Load pipeline execution."""
    result = run_etl_pipeline()
    log_audit_event(op_db, current_user, "ETL_EXECUTION", "warehouse", f"ETL Status: {result.get('status')}")
    return result

@router.get("/etl/history")
def get_etl_history(
    current_user: User = Depends(warehouse_viewers),
    wh_db: Session = Depends(get_warehouse_db)
):
    jobs = wh_db.query(ETLJob).order_by(ETLJob.id.desc()).limit(20).all()
    return [
        {
            "id": j.id,
            "job_name": j.job_name,
            "status": j.status,
            "records_extracted": j.records_extracted,
            "records_loaded": j.records_loaded,
            "error_count": j.error_count,
            "error_log": j.error_log,
            "started_at": j.started_at.isoformat() if j.started_at else None,
            "completed_at": j.completed_at.isoformat() if j.completed_at else None,
            "execution_time_seconds": j.execution_time_seconds
        }
        for j in jobs
    ]

# ---------------------------------------------
# OLAP CUBE OPERATIONS
# ---------------------------------------------

@router.get("/olap/rollup")
def olap_rollup(current_user: User = Depends(warehouse_viewers)):
    return {
        "operation": "Roll-Up",
        "description": "Aggregating daily admissions along the date hierarchy to monthly and annual totals.",
        "data": execute_olap_rollup()
    }

@router.get("/olap/drilldown")
def olap_drilldown(
    year: int = 2025,
    quarter: Optional[int] = None,
    current_user: User = Depends(warehouse_viewers)
):
    return {
        "operation": "Drill-Down",
        "description": f"Drilling down annual visits for {year} into quarterly/monthly granularity.",
        "data": execute_olap_drilldown(year=year, quarter=quarter)
    }

@router.get("/olap/slice")
def olap_slice(
    department: Optional[str] = "Cardiology",
    year: Optional[int] = None,
    current_user: User = Depends(warehouse_viewers)
):
    return {
        "operation": "Slice",
        "description": f"Slicing admission facts across fixed dimension: Department='{department}'",
        "data": execute_olap_slice(department_name=department, year=year)
    }

@router.get("/olap/dice")
def olap_dice(
    age_group: str = "65+ (Senior/Geriatric)",
    department: str = "Cardiology",
    current_user: User = Depends(warehouse_viewers)
):
    return {
        "operation": "Dice",
        "description": f"Dicing multidimensional sub-cube for AgeGroup='{age_group}' AND Department='{department}'",
        "data": execute_olap_dice(age_group=age_group, department_name=department)
    }

@router.get("/olap/pivot")
def olap_pivot(current_user: User = Depends(warehouse_viewers)):
    return {
        "operation": "Pivot (Cross-Tabulation)",
        "description": "Rotating dimensions: Department on rows vs Calendar Months on columns.",
        "data": execute_olap_pivot()
    }

@router.get("/reports/sql-pack")
def get_sql_reports(current_user: User = Depends(warehouse_viewers)):
    """Returns the 10 core SQL analytical reports from the warehouse."""
    return get_sql_reports_pack()
