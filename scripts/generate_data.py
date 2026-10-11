import os
import random
import csv
from datetime import datetime, timedelta, date

SEED = 42
random.seed(SEED)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUTPUT_DIR = os.path.join(BASE_DIR, "data", "synthetic")
os.makedirs(OUTPUT_DIR, exist_ok=True)

DEPARTMENTS = [
    {"id": "DEP-CAR", "name": "Cardiology", "description": "Heart, vascular, and cardiac circulation diseases"},
    {"id": "DEP-PUL", "name": "Pulmonology", "description": "Respiratory system, lungs, and acute bronchial care"},
    {"id": "DEP-NEU", "name": "Neurology", "description": "Brain, central nervous system, and neurovascular disorders"},
    {"id": "DEP-ORT", "name": "Orthopedics", "description": "Musculoskeletal system, joint reconstructions, and spine"},
    {"id": "DEP-GAS", "name": "Gastroenterology", "description": "Digestive tract, liver, and biliary system disorders"},
    {"id": "DEP-ONC", "name": "Oncology", "description": "Tumor diagnosis, systemic chemotherapy, and monitoring"},
    {"id": "DEP-END", "name": "Endocrinology", "description": "Diabetes management, thyroid, and endocrine metabolic disorders"},
    {"id": "DEP-GEN", "name": "General Medicine", "description": "Acute adult illnesses and primary inpatient triage"}
]

DOCTOR_NAMES = [
    ("Dr. Robert Chen", "DEP-CAR", "Interventional Cardiology"),
    ("Dr. Sarah Jenkins", "DEP-CAR", "Electrophysiology"),
    ("Dr. Marcus Vance", "DEP-PUL", "Pulmonary Critical Care"),
    ("Dr. Elena Rostova", "DEP-PUL", "Interstitial Lung Disease"),
    ("Dr. David Kim", "DEP-NEU", "Stroke & Cerebrovascular"),
    ("Dr. Amina Al-Mansoor", "DEP-NEU", "Neuro-oncology"),
    ("Dr. James Wilson", "DEP-ORT", "Joint Replacement"),
    ("Dr. Lisa Patel", "DEP-ORT", "Trauma & Spine Surgery"),
    ("Dr. Thomas Bradley", "DEP-GAS", "Hepatology & Cirrhosis"),
    ("Dr. Maria Garcia", "DEP-GAS", "Advanced Endoscopy"),
    ("Dr. William Thorne", "DEP-ONC", "Medical Oncology"),
    ("Dr. Rachel Green", "DEP-ONC", "Hematologic Malignancies"),
    ("Dr. Sanjay Gupta", "DEP-END", "Diabetic Endocrinology"),
    ("Dr. Claire Beauchamp", "DEP-END", "Metabolic Disorders"),
    ("Dr. Benjamin Hayes", "DEP-GEN", "Inpatient Internal Medicine"),
    ("Dr. Fiona Gallagher", "DEP-GEN", "Acute Diagnostic Medicine")
]

FIRST_NAMES = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth", 
               "David", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen",
               "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra",
               "Donald", "Ashley", "Steven", "Kimberly", "Paul", "Emily", "Andrew", "Donna", "Joshua", "Michelle"]

LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
              "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

DIAGNOSIS_CATALOG = {
    "DEP-CAR": [
        ("I10", "Hypertension", "Essential (primary) hypertension"),
        ("I50.9", "Heart Failure", "Congestive heart failure, unspecified"),
        ("I20.9", "Coronary Artery Disease", "Angina pectoris, unspecified"),
        ("I48.91", "Arrhythmia", "Unspecified atrial fibrillation")
    ],
    "DEP-PUL": [
        ("J44.9", "COPD", "Chronic obstructive pulmonary disease, unspecified"),
        ("J18.9", "Pneumonia", "Pneumonia, unspecified organism"),
        ("J45.909", "Asthma", "Unspecified asthma, uncomplicated"),
        ("J96.00", "Respiratory Failure", "Acute respiratory failure, unspecified")
    ],
    "DEP-NEU": [
        ("I63.9", "Cerebrovascular Stroke", "Cerebral infarction, unspecified"),
        ("G40.909", "Epilepsy", "Epilepsy, unspecified, not intractable"),
        ("G43.909", "Migraine", "Migraine, unspecified, not intractable"),
        ("G20", "Parkinson's Disease", "Parkinson's disease")
    ],
    "DEP-ORT": [
        ("M17.9", "Osteoarthritis", "Osteoarthritis of knee, unspecified"),
        ("M54.5", "Low Back Pain", "Low back pain"),
        ("S72.001A", "Femur Fracture", "Fracture of head of right femur"),
        ("M25.511", "Shoulder Arthropathy", "Pain in right shoulder")
    ],
    "DEP-GAS": [
        ("K21.9", "GERD", "Gastro-esophageal reflux disease without esophagitis"),
        ("K74.60", "Cirrhosis", "Unspecified cirrhosis of liver"),
        ("K50.90", "Crohn's Disease", "Crohn's disease, unspecified"),
        ("K29.70", "Gastritis", "Gastritis, unspecified, without bleeding")
    ],
    "DEP-ONC": [
        ("C34.90", "Lung Neoplasm", "Malignant neoplasm of unspecified part of bronchus/lung"),
        ("C50.919", "Breast Neoplasm", "Malignant neoplasm of unspecified site of female breast"),
        ("C18.9", "Colorectal Neoplasm", "Malignant neoplasm of colon, unspecified"),
        ("C92.00", "Acute Myeloid Leukemia", "Acute myeloblastic leukemia, not in remission")
    ],
    "DEP-END": [
        ("E11.9", "Type 2 Diabetes", "Type 2 diabetes mellitus without complications"),
        ("E11.65", "Diabetic Hyperglycemia", "Type 2 diabetes with hyperglycemia"),
        ("E03.9", "Hypothyroidism", "Hypothyroidism, unspecified"),
        ("E66.01", "Morbid Obesity", "Morbid (severe) obesity due to excess calories")
    ],
    "DEP-GEN": [
        ("A41.9", "Sepsis", "Sepsis, unspecified organism"),
        ("R50.9", "Pyrexia (Fever)", "Fever, unspecified"),
        ("R53.83", "Fatigue & Malaise", "Other fatigue"),
        ("E86.0", "Dehydration", "Dehydration")
    ]
}

PROCEDURES_CATALOG = {
    "DEP-CAR": [("Diagnostic Coronary Angiogram", "Interventional", 3200.0), ("Echocardiogram 2D", "Diagnostic", 650.0), ("Holter Monitor 24-hr", "Monitoring", 350.0)],
    "DEP-PUL": [("Bronchoscopy with Wash", "Endoscopic", 1850.0), ("Pulmonary Function Testing", "Diagnostic", 420.0), ("Non-invasive BiPAP Setup", "Respiratory Support", 950.0)],
    "DEP-NEU": [("Brain MRI with Contrast", "Radiology", 2100.0), ("Electroencephalogram (EEG)", "Diagnostic", 780.0), ("Carotid Doppler Ultrasound", "Diagnostic", 520.0)],
    "DEP-ORT": [("Total Knee Arthroplasty", "Surgical", 7800.0), ("Spine Fluoroscopic Injection", "Interventional", 1400.0), ("Digital Bone Radiography", "Radiology", 280.0)],
    "DEP-GAS": [("Diagnostic Colonoscopy", "Endoscopic", 1600.0), ("Esophagogastroduodenoscopy", "Endoscopic", 1450.0), ("Abdominal Ultrasound", "Radiology", 480.0)],
    "DEP-ONC": [("Systemic Chemotherapy Infusion", "Therapeutic", 4500.0), ("CT Chest-Abdomen-Pelvis", "Radiology", 2200.0), ("Bone Marrow Biopsy", "Pathology", 1950.0)],
    "DEP-END": [("Continuous Glucose Monitor Profiling", "Diagnostic", 400.0), ("Thyroid Fine Needle Aspiration", "Biopsy", 1100.0), ("IV Insulin Sliding Scale Stabilization", "Therapeutic", 850.0)],
    "DEP-GEN": [("Broad Spectrum IV Antibiotic Regimen", "Therapeutic", 1200.0), ("Comprehensive Metabolic Panel & Cultures", "Laboratory", 320.0), ("Rapid Fluid Resuscitation", "Therapeutic", 600.0)]
}

def generate_all_synthetic_data(num_patients=650):
    start_date = datetime(2025, 1, 1)
    end_date = datetime(2026, 9, 30)
    total_days = (end_date - start_date).days

    # 1. Departments
    dept_file = os.path.join(OUTPUT_DIR, "departments.csv")
    with open(dept_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "description", "is_active"])
        writer.writeheader()
        for dept in DEPARTMENTS:
            writer.writerow({
                "id": dept["id"],
                "name": dept["name"],
                "description": dept["description"],
                "is_active": True
            })

    # 2. Doctors
    doctors = []
    doc_file = os.path.join(OUTPUT_DIR, "doctors.csv")
    with open(doc_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "name", "specialty", "department_id", "contact_number", "email", "is_available", "is_active"])
        writer.writeheader()
        for i, (name, dept_id, spec) in enumerate(DOCTOR_NAMES, start=101):
            doc_id = f"DOC-{i}"
            doc_record = {
                "id": doc_id,
                "name": name,
                "specialty": spec,
                "department_id": dept_id,
                "contact_number": f"+1-555-01{i}",
                "email": f"{name.lower().replace('dr. ', '').replace(' ', '.')}@hospital.org",
                "is_available": True,
                "is_active": True
            }
            doctors.append(doc_record)
            writer.writerow(doc_record)

    # 3. Patients
    patients = []
    patient_file = os.path.join(OUTPUT_DIR, "patients.csv")
    with open(patient_file, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["id", "full_name", "date_of_birth", "age", "sex", "phone_number", "email", "address", "emergency_contact", "is_active"])
        writer.writeheader()
        for i in range(1, num_patients + 1):
            pat_id = f"PAT-{1000 + i}"
            sex = random.choice(["Male", "Female"])
            fn = random.choice(FIRST_NAMES)
            ln = random.choice(LAST_NAMES)
            name = f"{fn} {ln}"
            
            # Age skewed towards typical adult/elderly hospital population
            age = int(random.triangular(18, 92, 58))
            dob = (end_date - timedelta(days=int(age * 365.25 + random.randint(0, 360)))).date()
            
            pat_record = {
                "id": pat_id,
                "full_name": name,
                "date_of_birth": dob.isoformat(),
                "age": age,
                "sex": sex,
                "phone_number": f"+1-555-88{i:04d}",
                "email": f"{fn.lower()}.{ln.lower()}{i}@example.com",
                "address": f"{random.randint(100, 9999)} Health Ave, Metro City",
                "emergency_contact": f"Contact for {name} (+1-555-99{i:04d})",
                "is_active": True
            }
            patients.append(pat_record)
            writer.writerow(pat_record)

    # 4. Appointments & Encounters & Admissions & Diagnoses & Treatments & Billing & Payments
    appointments = []
    encounters = []
    admissions = []
    diagnoses = []
    treatments = []
    invoices = []
    payments = []

    apt_counter = 5001
    enc_counter = 9001
    adm_counter = 3001
    diag_counter = 1
    treat_counter = 1
    inv_counter = 7001
    pay_counter = 8001

    for pat in patients:
        pat_id = pat["id"]
        pat_age = pat["age"]
        
        # Determine number of hospital visits for this patient (1 to 6)
        # Chronic patients (elderly or with multiple visits) have follow-ups / readmissions
        is_chronic = (pat_age > 55 and random.random() < 0.40)
        num_encounters = random.choices([2, 3, 4, 5], weights=[0.30, 0.35, 0.25, 0.10])[0] if is_chronic else random.choices([1, 2, 3], weights=[0.60, 0.30, 0.10])[0]
        
        # Build patient timeline
        patient_timeline = []
        cur_t = start_date + timedelta(days=random.randint(0, total_days - 120))
        patient_timeline.append(cur_t)
        for _ in range(1, num_encounters):
            if is_chronic and random.random() < 0.55:
                # Readmission window within 10 to 28 days
                cur_t = cur_t + timedelta(days=random.randint(10, 28))
            else:
                cur_t = cur_t + timedelta(days=random.randint(35, 120))
            if cur_t < end_date:
                patient_timeline.append(cur_t)
        
        patient_timeline = sorted(patient_timeline)
        
        last_discharge_time = None
        last_adm_id = None
        
        for enc_date in patient_timeline:
            dept = random.choice(DEPARTMENTS)
            dept_id = dept["id"]
            dept_docs = [d for d in doctors if d["department_id"] == dept_id]
            doc = random.choice(dept_docs) if dept_docs else random.choice(doctors)
            doc_id = doc["id"]

            # Appointment
            apt_id = f"APT-{apt_counter}"
            apt_counter += 1
            apt_status = random.choices(["Completed", "Confirmed", "Cancelled", "No-Show"], weights=[0.80, 0.10, 0.05, 0.05])[0]
            appointments.append({
                "id": apt_id,
                "patient_id": pat_id,
                "doctor_id": doc_id,
                "department_id": dept_id,
                "appointment_date": enc_date.strftime("%Y-%m-%d %H:%M:%S"),
                "reason": f"Consultation for {dept['name']} care",
                "status": apt_status
            })

            if apt_status in ["Cancelled", "No-Show"]:
                continue

            # Encounter
            enc_id = f"ENC-{enc_counter}"
            enc_counter += 1
            
            # Acuity logic: higher admission probability if recently discharged or elderly
            is_inpatient = random.random() < (0.70 if last_discharge_time is not None and (enc_date - last_discharge_time).days <= 30 else (0.50 if pat_age > 60 else 0.25))
            enc_type = "Inpatient" if is_inpatient else random.choice(["Outpatient", "Emergency"])

            encounters.append({
                "id": enc_id,
                "patient_id": pat_id,
                "doctor_id": doc_id,
                "department_id": dept_id,
                "encounter_date": enc_date.strftime("%Y-%m-%d %H:%M:%S"),
                "encounter_type": enc_type,
                "notes": f"Encounter evaluated by {doc['name']} for {dept['name']} complaint."
            })

            # Diagnosis (1 to 3 diagnoses per encounter)
            possible_diags = DIAGNOSIS_CATALOG.get(dept_id, DIAGNOSIS_CATALOG["DEP-GEN"])
            chosen_diags = random.sample(possible_diags, min(len(possible_diags), random.randint(1, 2)))
            for idx, (dcode, dcat, ddesc) in enumerate(chosen_diags):
                diagnoses.append({
                    "id": diag_counter,
                    "encounter_id": enc_id,
                    "patient_id": pat_id,
                    "diagnosis_code": dcode,
                    "diagnosis_category": dcat,
                    "description": ddesc,
                    "is_primary": (idx == 0)
                })
                diag_counter += 1

            # Treatment (1 to 2 procedures)
            possible_procs = PROCEDURES_CATALOG.get(dept_id, PROCEDURES_CATALOG["DEP-GEN"])
            chosen_proc = random.choice(possible_procs)
            treatments.append({
                "id": treat_counter,
                "encounter_id": enc_id,
                "procedure_name": chosen_proc[0],
                "procedure_category": chosen_proc[1],
                "cost": chosen_proc[2],
                "performed_date": enc_date.strftime("%Y-%m-%d %H:%M:%S")
            })
            treat_counter += 1

            # Admissions & 30-Day Readmission Logic
            if is_inpatient:
                adm_id = f"ADM-{adm_counter}"
                adm_counter += 1
                
                # Length of stay between 1 and 14 days
                los = int(random.triangular(1, 14, 4))
                disch_date = enc_date + timedelta(days=los)
                
                # Check for 30-day readmission rule:
                # Was there a prior discharge for this patient within <= 30 days?
                is_readmission = False
                if last_discharge_time is not None:
                    delta_days = (enc_date - last_discharge_time).days
                    if 0 <= delta_days <= 30:
                        is_readmission = True
                
                admissions.append({
                    "id": adm_id,
                    "patient_id": pat_id,
                    "encounter_id": enc_id,
                    "department_id": dept_id,
                    "doctor_id": doc_id,
                    "admission_date": enc_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "discharge_date": disch_date.strftime("%Y-%m-%d %H:%M:%S"),
                    "length_of_stay": los,
                    "admission_type": random.choice(["Emergency", "Elective", "Urgent"]),
                    "discharge_status": "Discharged",
                    "is_readmission_30d": is_readmission,
                    "prior_admission_id": last_adm_id if is_readmission else ""
                })
                
                last_discharge_time = disch_date
                last_adm_id = adm_id

            # Invoices & Payments
            inv_id = f"INV-{inv_counter}"
            inv_counter += 1
            base_fee = 500.0 if not is_inpatient else (1200.0 * (los if 'los' in locals() else 3))
            total_bill = round(base_fee + chosen_proc[2], 2)
            
            # Payment behavior (Paid in full, partial, or unpaid)
            pay_pct = random.choices([1.0, 0.7, 0.0], weights=[0.75, 0.15, 0.10])[0]
            paid_amount = round(total_bill * pay_pct, 2)
            outstanding = round(total_bill - paid_amount, 2)
            pay_status = "Paid" if outstanding <= 0.01 else ("Partial" if paid_amount > 0 else "Unpaid")

            invoices.append({
                "id": inv_id,
                "patient_id": pat_id,
                "encounter_id": enc_id,
                "department_id": dept_id,
                "service_category": f"{dept['name']} Inpatient" if is_inpatient else f"{dept['name']} Clinic",
                "invoice_date": enc_date.strftime("%Y-%m-%d %H:%M:%S"),
                "amount_billed": total_bill,
                "amount_paid": paid_amount,
                "outstanding_balance": outstanding,
                "payment_status": pay_status
            })

            if paid_amount > 0:
                payments.append({
                    "id": f"PAY-{pay_counter}",
                    "invoice_id": inv_id,
                    "patient_id": pat_id,
                    "payment_date": (enc_date + timedelta(days=random.randint(0, 10))).strftime("%Y-%m-%d %H:%M:%S"),
                    "amount": paid_amount,
                    "payment_method": random.choice(["Credit Card", "Insurance Direct", "Debit Card", "ACH Transfer"]),
                    "transaction_reference": f"TXN-2026-{pay_counter}"
                })
                pay_counter += 1

    # Write remaining CSVs
    def write_csv(filename, fieldnames, data):
        filepath = os.path.join(OUTPUT_DIR, filename)
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for row in data:
                writer.writerow(row)
        print(f"Generated {filepath}: {len(data)} rows.")

    write_csv("appointments.csv", ["id", "patient_id", "doctor_id", "department_id", "appointment_date", "reason", "status"], appointments)
    write_csv("encounters.csv", ["id", "patient_id", "doctor_id", "department_id", "encounter_date", "encounter_type", "notes"], encounters)
    write_csv("admissions.csv", ["id", "patient_id", "encounter_id", "department_id", "doctor_id", "admission_date", "discharge_date", "length_of_stay", "admission_type", "discharge_status", "is_readmission_30d", "prior_admission_id"], admissions)
    write_csv("diagnoses.csv", ["id", "encounter_id", "patient_id", "diagnosis_code", "diagnosis_category", "description", "is_primary"], diagnoses)
    write_csv("treatments.csv", ["id", "encounter_id", "procedure_name", "procedure_category", "cost", "performed_date"], treatments)
    write_csv("invoices.csv", ["id", "patient_id", "encounter_id", "department_id", "service_category", "invoice_date", "amount_billed", "amount_paid", "outstanding_balance", "payment_status"], invoices)
    write_csv("payments.csv", ["id", "invoice_id", "patient_id", "payment_date", "amount", "payment_method", "transaction_reference"], payments)

    print("\n--- Synthetic Hospital Dataset Generation Complete ---")
    print(f"Patients: {len(patients)}")
    print(f"Doctors: {len(doctors)}")
    print(f"Departments: {len(DEPARTMENTS)}")
    print(f"Appointments: {len(appointments)}")
    print(f"Encounters: {len(encounters)}")
    print(f"Admissions: {len(admissions)}")
    readm_count = sum(1 for a in admissions if a["is_readmission_30d"])
    print(f"30-Day Readmissions: {readm_count} ({readm_count/len(admissions)*100:.1f}%)" if admissions else "0")
    print(f"Invoices: {len(invoices)}")
    print(f"Payments: {len(payments)}")

if __name__ == "__main__":
    generate_all_synthetic_data()
