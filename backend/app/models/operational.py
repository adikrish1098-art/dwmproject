import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text, Enum as SQLEnum, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.core.database import BaseOperational

class UserRole(str, enum.Enum):
    ADMINISTRATOR = "Administrator"
    DOCTOR = "Doctor"
    RECEPTIONIST = "Receptionist"
    DATA_ANALYST = "Data Analyst"

class AppointmentStatus(str, enum.Enum):
    SCHEDULED = "Scheduled"
    CONFIRMED = "Confirmed"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"
    NO_SHOW = "No-Show"

class EncounterType(str, enum.Enum):
    OUTPATIENT = "Outpatient"
    INPATIENT = "Inpatient"
    EMERGENCY = "Emergency"

class AdmissionType(str, enum.Enum):
    EMERGENCY = "Emergency"
    ELECTIVE = "Elective"
    URGENT = "Urgent"

class DischargeStatus(str, enum.Enum):
    DISCHARGED = "Discharged"
    TRANSFERRED = "Transferred"
    LEFT_AMA = "Against Medical Advice"

class PaymentStatus(str, enum.Enum):
    PAID = "Paid"
    PARTIAL = "Partial"
    UNPAID = "Unpaid"

class User(BaseOperational):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    role = Column(String(50), default=UserRole.RECEPTIONIST.value, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class AuditLog(BaseOperational):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    username = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False, index=True)
    resource = Column(String(100), nullable=False)
    details = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), index=True)

class Department(BaseOperational):
    __tablename__ = "departments"
    
    id = Column(String(20), primary_key=True)  # e.g. DEP-CAR, DEP-PUD
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    doctors = relationship("Doctor", back_populates="department")
    appointments = relationship("Appointment", back_populates="department")
    admissions = relationship("Admission", back_populates="department")

class Doctor(BaseOperational):
    __tablename__ = "doctors"
    
    id = Column(String(20), primary_key=True)  # e.g. DOC-101
    name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    department_id = Column(String(20), ForeignKey("departments.id"), nullable=False)
    contact_number = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    department = relationship("Department", back_populates="doctors")
    appointments = relationship("Appointment", back_populates="doctor")
    admissions = relationship("Admission", back_populates="doctor")

class Patient(BaseOperational):
    __tablename__ = "patients"
    
    id = Column(String(20), primary_key=True)  # e.g. PAT-1001
    full_name = Column(String(100), nullable=False, index=True)
    date_of_birth = Column(Date, nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(10), nullable=False)
    phone_number = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    address = Column(String(200), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    appointments = relationship("Appointment", back_populates="patient")
    encounters = relationship("Encounter", back_populates="patient")
    admissions = relationship("Admission", back_populates="patient")
    invoices = relationship("Invoice", back_populates="patient")

class Appointment(BaseOperational):
    __tablename__ = "appointments"
    
    id = Column(String(20), primary_key=True)  # e.g. APT-5001
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(20), ForeignKey("doctors.id"), nullable=False)
    department_id = Column(String(20), ForeignKey("departments.id"), nullable=False)
    appointment_date = Column(DateTime, nullable=False, index=True)
    reason = Column(String(255), nullable=True)
    status = Column(String(30), default=AppointmentStatus.SCHEDULED.value, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    department = relationship("Department", back_populates="appointments")

class Encounter(BaseOperational):
    __tablename__ = "encounters"
    
    id = Column(String(20), primary_key=True)  # e.g. ENC-9001
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(20), ForeignKey("doctors.id"), nullable=False)
    department_id = Column(String(20), ForeignKey("departments.id"), nullable=False)
    encounter_date = Column(DateTime, nullable=False, index=True)
    encounter_type = Column(String(30), default=EncounterType.OUTPATIENT.value, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = relationship("Patient", back_populates="encounters")
    doctor = relationship("Doctor")
    department = relationship("Department")
    diagnoses = relationship("Diagnosis", back_populates="encounter")
    treatments = relationship("Treatment", back_populates="encounter")
    admissions = relationship("Admission", back_populates="encounter")
    invoices = relationship("Invoice", back_populates="encounter")

class Admission(BaseOperational):
    __tablename__ = "admissions"
    
    id = Column(String(20), primary_key=True)  # e.g. ADM-3001
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(20), ForeignKey("encounters.id"), nullable=True)
    department_id = Column(String(20), ForeignKey("departments.id"), nullable=False)
    doctor_id = Column(String(20), ForeignKey("doctors.id"), nullable=False)
    admission_date = Column(DateTime, nullable=False, index=True)
    discharge_date = Column(DateTime, nullable=True)
    length_of_stay = Column(Integer, default=0)
    admission_type = Column(String(30), default=AdmissionType.EMERGENCY.value)
    discharge_status = Column(String(30), default=DischargeStatus.DISCHARGED.value)
    is_readmission_30d = Column(Boolean, default=False)
    prior_admission_id = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    patient = relationship("Patient", back_populates="admissions")
    encounter = relationship("Encounter", back_populates="admissions")
    department = relationship("Department", back_populates="admissions")
    doctor = relationship("Doctor", back_populates="admissions")

class Diagnosis(BaseOperational):
    __tablename__ = "diagnoses"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    encounter_id = Column(String(20), ForeignKey("encounters.id"), nullable=False)
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    diagnosis_code = Column(String(20), nullable=False)  # e.g. ICD10: I10, E11
    diagnosis_category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    is_primary = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    encounter = relationship("Encounter", back_populates="diagnoses")

class Treatment(BaseOperational):
    __tablename__ = "treatments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    encounter_id = Column(String(20), ForeignKey("encounters.id"), nullable=False)
    procedure_name = Column(String(150), nullable=False)
    procedure_category = Column(String(100), nullable=False, index=True)
    cost = Column(Float, default=0.0)
    performed_date = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    encounter = relationship("Encounter", back_populates="treatments")

class Invoice(BaseOperational):
    __tablename__ = "invoices"
    
    id = Column(String(20), primary_key=True)  # e.g. INV-7001
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    encounter_id = Column(String(20), ForeignKey("encounters.id"), nullable=True)
    department_id = Column(String(20), ForeignKey("departments.id"), nullable=False)
    service_category = Column(String(100), nullable=False)
    invoice_date = Column(DateTime, nullable=False, index=True)
    amount_billed = Column(Float, nullable=False, default=0.0)
    amount_paid = Column(Float, nullable=False, default=0.0)
    outstanding_balance = Column(Float, nullable=False, default=0.0)
    payment_status = Column(String(20), default=PaymentStatus.UNPAID.value)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    patient = relationship("Patient", back_populates="invoices")
    encounter = relationship("Encounter", back_populates="invoices")
    payments = relationship("Payment", back_populates="invoice")

class Payment(BaseOperational):
    __tablename__ = "payments"
    
    id = Column(String(20), primary_key=True)  # e.g. PAY-8001
    invoice_id = Column(String(20), ForeignKey("invoices.id"), nullable=False)
    patient_id = Column(String(20), ForeignKey("patients.id"), nullable=False)
    payment_date = Column(DateTime, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="Credit Card")
    transaction_reference = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    invoice = relationship("Invoice", back_populates="payments")
