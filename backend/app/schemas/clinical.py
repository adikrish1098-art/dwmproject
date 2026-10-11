from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, Field, ConfigDict

class PatientBase(BaseModel):
    full_name: str
    date_of_birth: date
    age: Optional[int] = None
    sex: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    is_active: Optional[bool] = None

class PatientResponse(PatientBase):
    id: str
    is_active: bool
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class DoctorResponse(BaseModel):
    id: str
    name: str
    specialty: str
    department_id: str
    contact_number: Optional[str] = None
    email: Optional[str] = None
    is_available: bool
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class DepartmentResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    is_active: bool

    model_config = ConfigDict(from_attributes=True)

class AppointmentCreate(BaseModel):
    patient_id: str
    doctor_id: str
    department_id: str
    appointment_date: datetime
    reason: Optional[str] = None

class AppointmentResponse(BaseModel):
    id: str
    patient_id: str
    doctor_id: str
    department_id: str
    appointment_date: datetime
    reason: Optional[str] = None
    status: str

    model_config = ConfigDict(from_attributes=True)

class AdmissionCreate(BaseModel):
    patient_id: str
    doctor_id: str
    department_id: str
    admission_date: datetime
    admission_type: str = "Emergency"
    initial_diagnosis: Optional[str] = "Acute Evaluation"

class AdmissionResponse(BaseModel):
    id: str
    patient_id: str
    department_id: str
    doctor_id: str
    admission_date: datetime
    discharge_date: Optional[datetime] = None
    length_of_stay: int
    admission_type: str
    discharge_status: str
    is_readmission_30d: bool
    prior_admission_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class InvoiceResponse(BaseModel):
    id: str
    patient_id: str
    department_id: str
    service_category: str
    invoice_date: datetime
    amount_billed: float
    amount_paid: float
    outstanding_balance: float
    payment_status: str

    model_config = ConfigDict(from_attributes=True)

class PaymentCreate(BaseModel):
    invoice_id: str
    amount: float
    payment_method: str = "Credit Card"

class PaymentResponse(BaseModel):
    id: str
    invoice_id: str
    patient_id: str
    payment_date: datetime
    amount: float
    payment_method: str
    transaction_reference: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
