from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.core.database import BaseWarehouse

# ==========================================
# 1. STAR SCHEMA DIMENSION TABLES
# ==========================================

class DimDate(BaseWarehouse):
    __tablename__ = "dim_date"
    
    date_key = Column(Integer, primary_key=True)  # YYYYMMDD, e.g. 20260415
    full_date = Column(Date, unique=True, nullable=False, index=True)
    day = Column(Integer, nullable=False)
    month = Column(Integer, nullable=False)
    quarter = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    weekday = Column(String(15), nullable=False)
    is_weekend = Column(Boolean, default=False)

class DimPatient(BaseWarehouse):
    __tablename__ = "dim_patient"
    
    patient_key = Column(Integer, primary_key=True, autoincrement=True)  # Surrogate Key
    source_patient_id = Column(String(50), nullable=False, index=True)   # Source natural key
    age_group = Column(String(30), nullable=False)                       # 0-18, 19-35, 36-50, 51-65, 65+
    sex = Column(String(10), nullable=False)
    registration_year = Column(Integer, nullable=False)
    # SCD Type 1 fields
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DimDoctor(BaseWarehouse):
    __tablename__ = "dim_doctor"
    
    doctor_key = Column(Integer, primary_key=True, autoincrement=True)
    source_doctor_id = Column(String(50), nullable=False, index=True)
    doctor_name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    department_name = Column(String(100), nullable=False)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DimDepartment(BaseWarehouse):
    __tablename__ = "dim_department"
    
    department_key = Column(Integer, primary_key=True, autoincrement=True)
    source_department_id = Column(String(50), nullable=False, index=True)
    department_name = Column(String(100), nullable=False)
    last_updated = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class DimDiagnosis(BaseWarehouse):
    __tablename__ = "dim_diagnosis"
    
    diagnosis_key = Column(Integer, primary_key=True, autoincrement=True)
    diagnosis_code = Column(String(30), nullable=False, index=True)
    diagnosis_category = Column(String(100), nullable=False, index=True)
    diagnosis_description = Column(String(255), nullable=False)

class DimEncounter(BaseWarehouse):
    __tablename__ = "dim_encounter"
    
    encounter_key = Column(Integer, primary_key=True, autoincrement=True)
    source_encounter_id = Column(String(50), nullable=False, index=True)
    encounter_type = Column(String(30), nullable=False)

# ==========================================
# 2. STAR SCHEMA FACT TABLES
# ==========================================

class FactPatientVisit(BaseWarehouse):
    __tablename__ = "fact_patient_visit"
    
    visit_key = Column(Integer, primary_key=True, autoincrement=True)
    patient_key = Column(Integer, ForeignKey("dim_patient.patient_key"), nullable=False, index=True)
    doctor_key = Column(Integer, ForeignKey("dim_doctor.doctor_key"), nullable=False, index=True)
    department_key = Column(Integer, ForeignKey("dim_department.department_key"), nullable=False, index=True)
    diagnosis_key = Column(Integer, ForeignKey("dim_diagnosis.diagnosis_key"), nullable=False, index=True)
    date_key = Column(Integer, ForeignKey("dim_date.date_key"), nullable=False, index=True)
    encounter_key = Column(Integer, ForeignKey("dim_encounter.encounter_key"), nullable=False, index=True)
    
    # Degenerate dimension or natural encounter reference
    source_encounter_id = Column(String(50), nullable=False)
    visit_count = Column(Integer, default=1, nullable=False)

class FactAdmission(BaseWarehouse):
    __tablename__ = "fact_admission"
    
    admission_key = Column(Integer, primary_key=True, autoincrement=True)
    patient_key = Column(Integer, ForeignKey("dim_patient.patient_key"), nullable=False, index=True)
    doctor_key = Column(Integer, ForeignKey("dim_doctor.doctor_key"), nullable=False, index=True)
    department_key = Column(Integer, ForeignKey("dim_department.department_key"), nullable=False, index=True)
    date_key = Column(Integer, ForeignKey("dim_date.date_key"), nullable=False, index=True)               # Admission Date
    discharge_date_key = Column(Integer, ForeignKey("dim_date.date_key"), nullable=True, index=True)    # Discharge Date
    encounter_key = Column(Integer, ForeignKey("dim_encounter.encounter_key"), nullable=False, index=True)
    
    source_admission_id = Column(String(50), nullable=False, unique=True)
    length_of_stay = Column(Integer, nullable=False, default=0)
    readmission_within_30_days = Column(Integer, default=0, nullable=False)  # 1 if readmission, 0 otherwise

class FactBilling(BaseWarehouse):
    __tablename__ = "fact_billing"
    
    billing_key = Column(Integer, primary_key=True, autoincrement=True)
    patient_key = Column(Integer, ForeignKey("dim_patient.patient_key"), nullable=False, index=True)
    department_key = Column(Integer, ForeignKey("dim_department.department_key"), nullable=False, index=True)
    date_key = Column(Integer, ForeignKey("dim_date.date_key"), nullable=False, index=True)
    encounter_key = Column(Integer, ForeignKey("dim_encounter.encounter_key"), nullable=False, index=True)
    
    source_invoice_id = Column(String(50), nullable=False, unique=True)
    amount_billed = Column(Float, nullable=False, default=0.0)
    amount_paid = Column(Float, nullable=False, default=0.0)
    outstanding_amount = Column(Float, nullable=False, default=0.0)

# ==========================================
# 3. ETL & ANALYTICAL METADATA TABLES
# ==========================================

class ETLJob(BaseWarehouse):
    __tablename__ = "etl_jobs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    job_name = Column(String(100), nullable=False)
    status = Column(String(30), nullable=False)  # SUCCESS, FAILED, RUNNING
    records_extracted = Column(Integer, default=0)
    records_loaded = Column(Integer, default=0)
    error_count = Column(Integer, default=0)
    error_log = Column(Text, nullable=True)
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    completed_at = Column(DateTime, nullable=True)
    execution_time_seconds = Column(Float, default=0.0)

class DatasetVersion(BaseWarehouse):
    __tablename__ = "dataset_versions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    version_tag = Column(String(50), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    patient_count = Column(Integer, default=0)
    admission_count = Column(Integer, default=0)
    encounter_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class MLModelRecord(BaseWarehouse):
    __tablename__ = "ml_models"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(100), nullable=False)
    algorithm = Column(String(50), nullable=False)
    hyperparameters = Column(Text, nullable=True)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=True)
    confusion_matrix = Column(Text, nullable=True)
    feature_importance = Column(Text, nullable=True)
    dataset_version = Column(String(50), default="v1.0")
    trained_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_active = Column(Boolean, default=True)

class AssociationRuleRecord(BaseWarehouse):
    __tablename__ = "association_rules"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    antecedent = Column(String(255), nullable=False)
    consequent = Column(String(255), nullable=False)
    support = Column(Float, nullable=False)
    confidence = Column(Float, nullable=False)
    lift = Column(Float, nullable=False)
    encounter_count = Column(Integer, default=0)
    generated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
