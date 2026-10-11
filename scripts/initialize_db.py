import os
import sys
import csv
from datetime import datetime

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.core.database import (
    operational_engine, warehouse_engine, 
    OperationalSessionLocal, WarehouseSessionLocal,
    BaseOperational, BaseWarehouse
)
from app.models.operational import (
    User, UserRole, Department, Doctor, Patient,
    Appointment, Encounter, Admission, Diagnosis, Treatment,
    Invoice, Payment, AuditLog
)
from app.models.warehouse import (
    DimDate, DimPatient, DimDoctor, DimDepartment, DimDiagnosis, DimEncounter,
    FactPatientVisit, FactAdmission, FactBilling,
    ETLJob, DatasetVersion, MLModelRecord, AssociationRuleRecord
)
from app.core.security import get_password_hash

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CSV_DIR = os.path.join(BASE_DIR, "data", "synthetic")

def init_databases():
    print("Creating operational and warehouse schema tables...")
    BaseOperational.metadata.create_all(bind=operational_engine)
    BaseWarehouse.metadata.create_all(bind=warehouse_engine)
    print("Schema tables initialized successfully.")

def seed_users():
    db = OperationalSessionLocal()
    try:
        if db.query(User).count() == 0:
            print("Seeding default role-based users...")
            demo_users = [
                User(
                    username="admin",
                    email="admin@hospital.org",
                    hashed_password=get_password_hash("AdminPassword123!"),
                    full_name="Chief Hospital Administrator",
                    role=UserRole.ADMINISTRATOR.value,
                    phone_number="+1-555-0100",
                    is_active=True
                ),
                User(
                    username="dr.robert",
                    email="dr.robert@hospital.org",
                    hashed_password=get_password_hash("DoctorPassword123!"),
                    full_name="Dr. Robert Chen",
                    role=UserRole.DOCTOR.value,
                    phone_number="+1-555-0101",
                    is_active=True
                ),
                User(
                    username="reception",
                    email="reception@hospital.org",
                    hashed_password=get_password_hash("ReceptionPassword123!"),
                    full_name="Front Desk Receptionist",
                    role=UserRole.RECEPTIONIST.value,
                    phone_number="+1-555-0102",
                    is_active=True
                ),
                User(
                    username="analyst",
                    email="analyst@hospital.org",
                    hashed_password=get_password_hash("AnalystPassword123!"),
                    full_name="Senior Data Analyst",
                    role=UserRole.DATA_ANALYST.value,
                    phone_number="+1-555-0103",
                    is_active=True
                )
            ]
            db.add_all(demo_users)
            db.commit()
            print(f"Seeded {len(demo_users)} demonstration users.")
        else:
            print("Users already seeded.")
    finally:
        db.close()

def load_csv(filename):
    filepath = os.path.join(CSV_DIR, filename)
    if not os.path.exists(filepath):
        print(f"Warning: {filepath} not found. Run scripts/generate_data.py first.")
        return []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)

def seed_operational_data():
    db = OperationalSessionLocal()
    try:
        # 1. Departments
        if db.query(Department).count() == 0:
            dept_rows = load_csv("departments.csv")
            depts = [
                Department(
                    id=row["id"],
                    name=row["name"],
                    description=row["description"],
                    is_active=(row["is_active"] in ["True", "1"])
                ) for row in dept_rows
            ]
            db.add_all(depts)
            db.commit()
            print(f"Seeded {len(depts)} departments.")

        # 2. Doctors
        if db.query(Doctor).count() == 0:
            doc_rows = load_csv("doctors.csv")
            doctors = [
                Doctor(
                    id=row["id"],
                    name=row["name"],
                    specialty=row["specialty"],
                    department_id=row["department_id"],
                    contact_number=row["contact_number"],
                    email=row["email"],
                    is_available=(row["is_available"] in ["True", "1"]),
                    is_active=(row["is_active"] in ["True", "1"])
                ) for row in doc_rows
            ]
            db.add_all(doctors)
            db.commit()
            print(f"Seeded {len(doctors)} doctors.")

        # 3. Patients
        if db.query(Patient).count() == 0:
            pat_rows = load_csv("patients.csv")
            patients = [
                Patient(
                    id=row["id"],
                    full_name=row["full_name"],
                    date_of_birth=datetime.strptime(row["date_of_birth"], "%Y-%m-%d").date(),
                    age=int(row["age"]),
                    sex=row["sex"],
                    phone_number=row["phone_number"],
                    email=row["email"],
                    address=row["address"],
                    emergency_contact=row["emergency_contact"],
                    is_active=(row["is_active"] in ["True", "1"])
                ) for row in pat_rows
            ]
            db.add_all(patients)
            db.commit()
            print(f"Seeded {len(patients)} patients.")

        # 4. Appointments
        if db.query(Appointment).count() == 0:
            apt_rows = load_csv("appointments.csv")
            appointments = [
                Appointment(
                    id=row["id"],
                    patient_id=row["patient_id"],
                    doctor_id=row["doctor_id"],
                    department_id=row["department_id"],
                    appointment_date=datetime.strptime(row["appointment_date"], "%Y-%m-%d %H:%M:%S"),
                    reason=row["reason"],
                    status=row["status"]
                ) for row in apt_rows
            ]
            db.add_all(appointments)
            db.commit()
            print(f"Seeded {len(appointments)} appointments.")

        # 5. Encounters
        if db.query(Encounter).count() == 0:
            enc_rows = load_csv("encounters.csv")
            encounters = [
                Encounter(
                    id=row["id"],
                    patient_id=row["patient_id"],
                    doctor_id=row["doctor_id"],
                    department_id=row["department_id"],
                    encounter_date=datetime.strptime(row["encounter_date"], "%Y-%m-%d %H:%M:%S"),
                    encounter_type=row["encounter_type"],
                    notes=row["notes"]
                ) for row in enc_rows
            ]
            db.add_all(encounters)
            db.commit()
            print(f"Seeded {len(encounters)} encounters.")

        # 6. Diagnoses
        if db.query(Diagnosis).count() == 0:
            diag_rows = load_csv("diagnoses.csv")
            diagnoses = [
                Diagnosis(
                    id=int(row["id"]),
                    encounter_id=row["encounter_id"],
                    patient_id=row["patient_id"],
                    diagnosis_code=row["diagnosis_code"],
                    diagnosis_category=row["diagnosis_category"],
                    description=row["description"],
                    is_primary=(row["is_primary"] in ["True", "1"])
                ) for row in diag_rows
            ]
            db.add_all(diagnoses)
            db.commit()
            print(f"Seeded {len(diagnoses)} diagnoses.")

        # 7. Treatments
        if db.query(Treatment).count() == 0:
            treat_rows = load_csv("treatments.csv")
            treatments = [
                Treatment(
                    id=int(row["id"]),
                    encounter_id=row["encounter_id"],
                    procedure_name=row["procedure_name"],
                    procedure_category=row["procedure_category"],
                    cost=float(row["cost"]),
                    performed_date=datetime.strptime(row["performed_date"], "%Y-%m-%d %H:%M:%S")
                ) for row in treat_rows
            ]
            db.add_all(treatments)
            db.commit()
            print(f"Seeded {len(treatments)} treatments.")

        # 8. Admissions
        if db.query(Admission).count() == 0:
            adm_rows = load_csv("admissions.csv")
            admissions = [
                Admission(
                    id=row["id"],
                    patient_id=row["patient_id"],
                    encounter_id=row["encounter_id"],
                    department_id=row["department_id"],
                    doctor_id=row["doctor_id"],
                    admission_date=datetime.strptime(row["admission_date"], "%Y-%m-%d %H:%M:%S"),
                    discharge_date=datetime.strptime(row["discharge_date"], "%Y-%m-%d %H:%M:%S") if row["discharge_date"] else None,
                    length_of_stay=int(row["length_of_stay"]),
                    admission_type=row["admission_type"],
                    discharge_status=row["discharge_status"],
                    is_readmission_30d=(row["is_readmission_30d"] in ["True", "1"]),
                    prior_admission_id=row["prior_admission_id"] if row["prior_admission_id"] else None
                ) for row in adm_rows
            ]
            db.add_all(admissions)
            db.commit()
            print(f"Seeded {len(admissions)} admissions.")

        # 9. Invoices
        if db.query(Invoice).count() == 0:
            inv_rows = load_csv("invoices.csv")
            invoices = [
                Invoice(
                    id=row["id"],
                    patient_id=row["patient_id"],
                    encounter_id=row["encounter_id"],
                    department_id=row["department_id"],
                    service_category=row["service_category"],
                    invoice_date=datetime.strptime(row["invoice_date"], "%Y-%m-%d %H:%M:%S"),
                    amount_billed=float(row["amount_billed"]),
                    amount_paid=float(row["amount_paid"]),
                    outstanding_balance=float(row["outstanding_balance"]),
                    payment_status=row["payment_status"]
                ) for row in inv_rows
            ]
            db.add_all(invoices)
            db.commit()
            print(f"Seeded {len(invoices)} invoices.")

        # 10. Payments
        if db.query(Payment).count() == 0:
            pay_rows = load_csv("payments.csv")
            payments = [
                Payment(
                    id=row["id"],
                    invoice_id=row["invoice_id"],
                    patient_id=row["patient_id"],
                    payment_date=datetime.strptime(row["payment_date"], "%Y-%m-%d %H:%M:%S"),
                    amount=float(row["amount"]),
                    payment_method=row["payment_method"],
                    transaction_reference=row["transaction_reference"]
                ) for row in pay_rows
            ]
            db.add_all(payments)
            db.commit()
            print(f"Seeded {len(payments)} payments.")

        print("Operational database seeding completed successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding operational database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    init_databases()
    seed_users()
    seed_operational_data()
