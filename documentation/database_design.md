# Database Design & Data Warehouse Schema

## 1. Operational Database Schema (OLTP)

The operational database (`hospital_operational.db`) models daily clinical and administrative operations normalized to Third Normal Form (3NF).

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : performs
    PATIENTS ||--o{ APPOINTMENTS : books
    PATIENTS ||--o{ ADMISSIONS : undergoes
    PATIENTS ||--o{ ENCOUNTERS : experiences
    PATIENTS ||--o{ INVOICES : billed_to
    DOCTORS ||--o{ APPOINTMENTS : conducts
    DOCTORS ||--o{ ADMISSIONS : attends
    DEPARTMENTS ||--o{ DOCTORS : employs
    DEPARTMENTS ||--o{ ADMISSIONS : hosts
    ENCOUNTERS ||--o{ DIAGNOSES : contains
    ENCOUNTERS ||--o{ TREATMENTS : includes
    INVOICES ||--o{ PAYMENTS : settles

    USERS {
        int id PK
        string username UK
        string email UK
        string hashed_password
        string role
        boolean is_active
        datetime last_login
    }

    PATIENTS {
        string patient_id PK
        string full_name
        date dob
        int age
        string gender
        string phone
        string email
        string address
        date registration_date
        string emergency_contact
        boolean is_active
    }

    DOCTORS {
        string doctor_id PK
        string full_name
        string specialty
        int department_id FK
        string contact_number
        string status
    }

    DEPARTMENTS {
        int department_id PK
        string name UK
        string description
        string status
    }

    APPOINTMENTS {
        int id PK
        string patient_id FK
        string doctor_id FK
        datetime appointment_date
        string status
        string reason
    }

    ADMISSIONS {
        string admission_id PK
        string patient_id FK
        string doctor_id FK
        int department_id FK
        datetime admission_date
        datetime discharge_date
        int length_of_stay
        string admission_type
        string discharge_status
        boolean readmission_30d
    }

    ENCOUNTERS {
        string encounter_id PK
        string patient_id FK
        string encounter_type
        datetime encounter_date
    }

    DIAGNOSES {
        int id PK
        string encounter_id FK
        string diagnosis_code
        string category
        string description
    }

    TREATMENTS {
        int id PK
        string encounter_id FK
        string procedure_category
        string description
        decimal cost
    }

    INVOICES {
        string invoice_id PK
        string patient_id FK
        string encounter_id FK
        int department_id FK
        date invoice_date
        decimal amount_billed
        decimal amount_paid
        decimal outstanding_balance
        string status
    }

    PAYMENTS {
        int payment_id PK
        string invoice_id FK
        decimal amount
        datetime payment_date
        string payment_method
    }
```

---

## 2. Data Warehouse Dimensional Schema (OLAP - Star Schema)

The analytical data warehouse (`hospital_warehouse.db`) is structured as a **Star Schema** containing 6 dimension tables and 3 central fact tables.

```mermaid
classDiagram
    class DimPatient {
        +int patient_key PK
        +string source_patient_id
        +string age_group
        +string gender
    }
    class DimDoctor {
        +int doctor_key PK
        +string source_doctor_id
        +string specialty
    }
    class DimDepartment {
        +int department_key PK
        +string department_name
    }
    class DimDiagnosis {
        +int diagnosis_key PK
        +string diagnosis_category
        +string diagnosis_description
    }
    class DimDate {
        +int date_key PK
        +date full_date
        +int day
        +int month
        +int quarter
        +int year
        +string weekday
    }
    class DimEncounter {
        +int encounter_key PK
        +string encounter_type
    }

    class FactPatientVisit {
        +int visit_key PK
        +int patient_key FK
        +int doctor_key FK
        +int department_key FK
        +int diagnosis_key FK
        +int date_key FK
        +int encounter_key FK
        +int visit_count
    }

    class FactAdmission {
        +int admission_key PK
        +int patient_key FK
        +int doctor_key FK
        +int department_key FK
        +int date_key FK
        +int discharge_date_key FK
        +int encounter_key FK
        +int length_of_stay
        +int readmission_within_30_days
    }

    class FactBilling {
        +int billing_key PK
        +int patient_key FK
        +int department_key FK
        +int date_key FK
        +int encounter_key FK
        +decimal amount_billed
        +decimal amount_paid
        +decimal outstanding_amount
    }

    FactPatientVisit --> DimPatient
    FactPatientVisit --> DimDoctor
    FactPatientVisit --> DimDepartment
    FactPatientVisit --> DimDiagnosis
    FactPatientVisit --> DimDate
    FactPatientVisit --> DimEncounter

    FactAdmission --> DimPatient
    FactAdmission --> DimDoctor
    FactAdmission --> DimDepartment
    FactAdmission --> DimDate
    FactAdmission --> DimEncounter

    FactBilling --> DimPatient
    FactBilling --> DimDepartment
    FactBilling --> DimDate
    FactBilling --> DimEncounter
```

---

## 3. Fact Table Grains and Analytical Measures

1. **`FactPatientVisit`**:
   - **Grain**: One record per individual clinical visit/consultation encounter and primary diagnosis.
   - **Measures**: `visit_count` (additive integer measure, default 1).
   - **Use cases**: Measuring outpatient workload, daily clinic attendance, department-specific consultation frequency.

2. **`FactAdmission`**:
   - **Grain**: One record per completed or ongoing hospital inpatient stay.
   - **Measures**: `length_of_stay` (additive integer in days), `readmission_within_30_days` (binary flag: 1 = readmitted, 0 = non-readmitted).
   - **Use cases**: Monitoring bed occupancy, department length-of-stay averages, 30-day readmission rate calculations.

3. **`FactBilling`**:
   - **Grain**: One record per issued invoice linked to patient encounter.
   - **Measures**: `amount_billed`, `amount_paid`, `outstanding_amount` (fully additive financial decimals).
   - **Use cases**: Revenue analysis, accounts receivable, department collection efficiency, financial forecasting.

---

## 4. Surrogate Keys and Slowly Changing Dimensions (SCD)

- **Surrogate Keys**: Integer auto-incrementing primary keys (`patient_key`, `doctor_key`, `date_key`, etc.) insulate the warehouse from changes in operational source keys (`source_patient_id`), maintain analytical referential integrity, and provide superior join indexing performance.
- **SCD Strategy**:
  - Implements **SCD Type 1 (Overwrite)** for demographic corrections and specialty updates.
  - In a Type 1 implementation, existing dimension attributes are updated in-place when demographic discrepancies are rectified, ensuring operational correctness without preserving erroneous historical records.
  - The architectural documentation details how transitioning to **SCD Type 2 (Historical Versioning with `valid_from`, `valid_to`, `is_current`)** would occur in enterprise production warehouses.
