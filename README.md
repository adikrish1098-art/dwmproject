# Hospital Data Warehouse and Patient Analysis Using Data Mining Techniques

A full-stack, enterprise-grade college mini project integrating Hospital Information Management (HIS), Dimensional Data Warehousing (Star Schema OLAP), Automated ETL Processing, and Data Mining/Machine Learning Pipelines into a responsive web application.

---

## 🏥 Key Features

- **Operational Hospital Management (OLTP)**: Complete CRUD modules for Patients, Doctors, Departments, Appointments, Inpatient Admissions, Diagnoses, Treatments, and Billing/Invoicing.
- **Enterprise Authentication & RBAC**: JWT-based session security with password hashing (Argon2 / Bcrypt) and 4 strict roles:
  - 👑 **Administrator**: Full hospital control, user management, audit logs, ETL, and model retraining.
  - 🩺 **Doctor**: Access to patient clinical histories, admissions, encounters, and clinical summaries.
  - 📋 **Receptionist**: Patient registration, demographic updates, appointment scheduling, and check-in status.
  - 📊 **Data Analyst**: Access to de-identified warehouse datasets, ETL pipelines, clustering, association rules, and ML models.
- **Dimensional Data Warehouse (OLAP)**:
  - **Star Schema**: 6 Dimensions (`DimPatient`, `DimDoctor`, `DimDepartment`, `DimDiagnosis`, `DimDate`, `DimEncounter`) and 3 Fact Tables (`FactPatientVisit`, `FactAdmission`, `FactBilling`).
  - **OLAP Queries**: Roll-up, Drill-down, Slice, Dice, and Pivot query engine.
- **Automated & Idempotent ETL Pipeline**:
  - Extract synthetic records, cleanse and impute missing values, validate constraints, and load dimensions prior to facts with execution audit logging.
- **Data Mining & Machine Learning**:
  - **Patient Clustering (K-Means)**: Feature scaling, Elbow Method, Silhouette score analysis, and 2D PCA cluster visualization.
  - **Association Rule Mining (Apriori)**: Encounter-level transaction mining with Support, Confidence, and Lift metrics.
  - **30-Day Readmission Prediction**: Strict temporal feature extraction (preventing data leakage) and patient-grouped evaluation across Baseline Dummy, Logistic Regression, Random Forest, and Decision Tree classifiers.
  - **Model Comparison Suite**: Comparative evaluation matrices, confusion matrices, and ROC/PR performance curves.
- **Automated Testing Suite**: Pytest integration tests covering auth, CRUD, scheduling constraints, ETL idempotency, and ML training pipelines.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React, Recharts, React Router v6.
- **Backend**: Python 3.14 / 3.11+, FastAPI, Pydantic v2, SQLAlchemy 2.0.
- **Databases**: SQLite (separated operational `hospital_operational.db` and analytical `hospital_warehouse.db`).
- **Data Science**: Scikit-Learn, Pandas, NumPy, mlxtend.
- **Testing**: Pytest, FastAPI TestClient (`httpx`).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ and npm installed

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Return to root directory
cd ..
```

### 3. Initialize Databases & Synthetic Data

```bash
# Activate virtual environment
source backend/venv/bin/activate

# 1. Generate realistic synthetic hospital datasets
python scripts/generate_data.py

# 2. Initialize operational and warehouse database schemas + create default users
python scripts/initialize_db.py

# 3. Execute the initial ETL pipeline to populate the data warehouse
python scripts/run_etl.py
```

### 4. Run Backend Server

```bash
source backend/venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```
*API Swagger Documentation will be accessible at:* `http://localhost:8000/docs`

### 5. Frontend Setup & Launch

Open a new terminal window:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
*The web application will be live at:* `http://localhost:5173`

---

## 🔐 Default Demo Accounts

All demo accounts are pre-seeded in the database for instant testing:

| Role | Username | Password | Permitted Modules |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `AdminPassword123!` | All 21 features, User Management, Audit Logs, ETL, ML, Datasets |
| **Doctor** | `dr.robert` | `DoctorPassword123!` | Patients, Clinical Records, Admissions, Predictions, Summary Reports |
| **Receptionist** | `reception` | `ReceptionPassword123!` | Patient Registration, Appointments, Inpatient Admissions, Billing |
| **Data Analyst** | `analyst` | `AnalystPassword123!` | Data Warehouse, ETL, K-Means, Apriori, Readmission ML, Certified Exports |

---

## 🧪 Running Automated Tests

### Backend Test Suite (Pytest)

Run all 28 backend unit and API integration tests:

```bash
source backend/venv/bin/activate
PYTHONPATH=backend pytest backend/tests -v
```

All 28 comprehensive tests will execute and pass:
- User signup validation edge cases & duplicate account prevention
- Secure password hashing and session token verification
- Role-based access authorization and endpoint guarding
- Full Patient CRUD (with automatic age calculation from DOB) & de-identification
- Appointment scheduling conflict detection
- Inpatient admission and 30-day readmission calculations & LOS determination
- Foreign-key integrity constraint enforcement
- SQL aggregation correctness & OLAP cube totals verification
- ETL pipeline idempotency and zero-duplicate reload safeguards
- Machine learning pipelines (K-Means, Apriori, Decision Trees, Readmission prediction)
- Prediction data leakage safeguards (strict patient isolation via GroupShuffleSplit)
- Dataset CSV upload schema validation and file previewing
- Report export role restrictions (blocking unauthorized analytical exports)
- Multi-dimensional date-range and department filtering

### Frontend Test Suite (Node Test Runner)

Run all 14 automated frontend form, validation, and RBAC tests:

```bash
cd frontend
npm test
```

All 14 frontend unit tests will execute and pass:
- Signup email regex and format validation
- Password length and confirmation matching
- Terms & privacy condition enforcement
- Public signup restricted role assignment
- 21 sidebar navigation route permissions across 4 roles
- Receptionist and Data Analyst permission boundary enforcement
- Patient age computation from date of birth
- 30-day readmission chronological window evaluation
- Length of stay calculation
- Financial balance and collection efficiency math
- In-memory token storage (no secrets stored in localStorage)

To check strict TypeScript compilation across all 25 views and components:

```bash
cd frontend
npm run build   # Or: ./node_modules/.bin/tsc --noEmit
```

---

## 📁 Project Directory Structure

```
dwm_mini_project/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # REST API routers (auth, patients, etl, mining, ml, datasets, reports, etc.)
│   │   ├── core/           # Config (unified root data paths), database engines, security
│   │   ├── etl/            # ETL pipeline orchestration & idempotent loading
│   │   ├── mining/         # K-Means clustering and Apriori association algorithms
│   │   ├── ml/             # Readmission prediction models and Decision Trees
│   │   ├── models/         # SQLAlchemy models (operational & warehouse star schema)
│   │   ├── schemas/        # Pydantic validation schemas
│   │   └── warehouse/      # OLAP query engine
│   ├── tests/              # Pytest test suite (28 automated tests)
│   ├── main.py             # FastAPI entrypoint
│   └── requirements.txt    # Python dependencies
├── data/
│   ├── hospital_operational.db # SQLite operational OLTP database
│   ├── hospital_warehouse.db   # SQLite analytical Star Schema OLAP warehouse
│   └── synthetic/          # 10 relational synthetic hospital CSV datasets (seed 42)
├── documentation/
│   ├── architecture.md     # System architecture, Star Schema, DFD
│   ├── database_design.md  # ER diagram, Star Schema diagram, fact grains, SCD Type 1
│   ├── algorithm_explanations.md # Mathematical formulations & ML pipelines
│   ├── report_outline.md   # Project report outline (Chapters 1–7)
│   ├── presentation_outline.md # 12-slide presentation script & demo flow
│   ├── viva_questions.md   # 25+ comprehensive viva questions with model answers
│   └── troubleshooting_and_security.md # Setup, security mitigations, and ethics disclosure
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI cards, tables, modal dialogs, charts
│   │   ├── context/        # Auth and notification context
│   │   ├── layouts/        # AppLayout with responsive sidebar and navbar
│   │   ├── pages/          # 25 feature pages (Dashboard, Patients, Datasets, Reports, etc.)
│   │   ├── services/       # API client with in-memory token and HttpOnly SameSite cookie support
│   │   ├── tests/          # Frontend automated tests (14 test cases)
│   │   └── types/          # TypeScript interface definitions
│   ├── package.json
│   └── tailwind.config.js
├── scripts/
│   ├── generate_data.py    # Synthetic hospital dataset generator
│   ├── initialize_db.py    # Database creation & user seeding
│   └── run_etl.py          # Standalone ETL runner script
├── README.md               # Project guide and documentation
└── .gitignore
```
│   ├── architecture.md     # System architecture, Star Schema, DFD
│   ├── database_design.md  # ER diagram, Star Schema diagram, fact grains, SCD Type 1
│   ├── algorithm_explanations.md # Mathematical formulations & ML pipelines
│   ├── report_outline.md   # Project report outline (Chapters 1–7)
│   ├── presentation_outline.md # 12-slide presentation script & demo flow
│   ├── viva_questions.md   # 25+ comprehensive viva questions with model answers
│   └── troubleshooting_and_security.md # Setup, security mitigations, and ethics disclosure
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI cards, tables, modal dialogs, charts
│   │   ├── context/        # Auth and notification context
│   │   ├── layouts/        # AppLayout with responsive sidebar and navbar
│   │   ├── pages/          # 21 feature pages (Dashboard, Patients, ETL, Mining, ML, etc.)
│   │   ├── services/       # API client with JWT cookie and Bearer support
│   │   └── types/          # TypeScript interface definitions
│   ├── package.json
│   └── tailwind.config.js
├── scripts/
│   ├── generate_data.py    # Synthetic hospital dataset generator
│   ├── initialize_db.py    # Database creation & user seeding
│   └── run_etl.py          # Standalone ETL runner script
├── README.md               # Project guide and documentation
└── .gitignore
```

---

## 🎓 Academic Viva & Presentation Deliverables

The `documentation/` directory contains complete academic evaluation resources:
- `documentation/architecture.md`: Architecture diagrams, component interactions, Star Schema, and DFD.
- `documentation/database_design.md`: Operational ER schema, Analytical Star Schema, SCD Type 1, and Data Dictionaries.
- `documentation/algorithm_explanations.md`: Complete mathematical writeups for K-Means, Apriori, Logistic Regression, Random Forest, and Decision Trees.
- `documentation/report_outline.md`: Academic mini project report structure (Chapters 1–7).
- `documentation/presentation_outline.md`: 12-slide presentation script and live demonstration workflow.
- `documentation/viva_questions.md`: 25+ curated viva questions and comprehensive model answers.
- `documentation/troubleshooting_and_security.md`: Setup instructions, security architecture, RBAC, and synthetic data ethics disclosure.
