# Troubleshooting, Security & Ethics Guide

## 1. System Setup & Prerequisites

### 1.1 Prerequisites
- **Python:** Version 3.10 or higher (tested with Python 3.12 / 3.14).
- **Node.js:** Version 18.0 or higher (v20+ recommended).
- **Package Managers:** `pip` (Python) and `npm` (Node).
- **Supported Operating Systems:** macOS (ARM64 / x86_64), Linux (Ubuntu 20.04+), Windows 10/11 (WSL2 recommended).

---

## 2. Step-by-Step Installation & Startup

### 2.1 Backend Setup
```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a Python virtual environment
python3 -m venv venv
source venv/bin/activate    # On Windows: venv\Scripts\activate

# 3. Upgrade pip and install all production dependencies
pip install --upgrade pip
pip install -r requirements.txt

# 4. Verify backend automated test suite (18 unit/integration tests)
pytest -v

# 5. Start the FastAPI development server
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
- Interactive API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`
- Alternative API Specification (ReDoc): `http://127.0.0.1:8000/redoc`

### 2.2 Frontend Setup
```bash
# 1. In a separate terminal, navigate to the frontend directory
cd frontend

# 2. Install all npm dependencies
npm install

# 3. Perform TypeScript type checking
npx tsc --noEmit

# 4. Start Vite development server
npm run dev
```
- Web Application URL: `http://localhost:5173`

---

## 3. Seed Accounts & Default Credentials

The system initializes default role-based accounts seeded for academic evaluation:

| Username | Password | Role | Access Scope |
| :--- | :--- | :--- | :--- |
| `admin` | `Admin@123` | **Administrator** | Full access: User management, ETL control, security logs, data mining. |
| `doctor1` | `Doctor@123` | **Doctor** | Clinical modules: Patients, appointments, admissions, risk inference. |
| `reception1` | `Recep@123` | **Receptionist** | Administrative intake: Patient registration, appointments, billing. |
| `analyst1` | `Analyst@123` | **Data Analyst** | Analytics: Star schema browser, OLAP cubes, K-Means, Apriori, ML. |

---

## 4. Common Troubleshooting Scenarios

### 4.1 Backend Port 8000 Conflict
- **Symptom:** `ERROR: [Errno 48] Address already in use`
- **Solution:** 
  ```bash
  # Check which process is occupying port 8000
  lsof -i :8000
  # Terminate the lingering process
  kill -9 <PID>
  # Alternatively, launch FastAPI on a different port
  uvicorn main:app --reload --port 8001
  ```
  *Note: If changing backend port to 8001, update Vite proxy target in `frontend/vite.config.ts`.*

### 4.2 SQLite Database Not Found or Schema Desync
- **Symptom:** `sqlite3.OperationalError: no such table: users` or `dim_date`
- **Solution:** Re-run the automated database initialization script:
  ```bash
  cd backend
  source venv/bin/activate
  python -c "from app.core.database import init_databases; init_databases()"
  python ../scripts/seed_database.py
  ```

### 4.3 Frontend Network Error or Failed API Requests
- **Symptom:** `Network Error` or `500 Internal Server Error` in browser console.
- **Checks:**
  1. Verify FastAPI server is running on `http://127.0.0.1:8000`.
  2. Verify Vite proxy configuration in `frontend/vite.config.ts` correctly forwards `/api` to `http://127.0.0.1:8000`.
  3. Ensure cookies are enabled in your browser for dual cookie/bearer authentication.

### 4.4 TypeScript Unused Variable Compilation Warnings
- **Symptom:** `error TS6133: '<identifier>' is declared but its value is never read.`
- **Explanation:** `frontend/tsconfig.json` enforces strict compiler flags (`noUnusedLocals: true`, `noUnusedParameters: true`).
- **Solution:** Run `npx tsc --noEmit` locally to identify unused imports and remove them prior to builds.

---

## 5. Security Architecture & Threat Mitigations

### 5.1 Credential Protection & Password Hashing
- **Algorithm:** PBKDF2 with HMAC-SHA256 implemented via `passlib.context.CryptContext`.
- **Policy:** Plaintext passwords are never persisted to disk or logged. A salted 256-bit digest is stored in `users.hashed_password`.

### 5.2 Token Security & Session Management
- **Token Mechanism:** JSON Web Tokens (JWT) signed with HMAC-SHA256 (`HS256`) using a 256-bit secret key.
- **Dual Transport:**
  - Standard Single Page Application requests leverage secure `HTTP-Only`, `SameSite=Lax` cookies, shielding authentication tokens from Cross-Site Scripting (XSS) attacks.
  - Programmatic API and integration clients utilize standard `Authorization: Bearer <token>` headers.
- **Expiration:** Tokens are minted with a configurable time-to-live (`ACCESS_TOKEN_EXPIRE_MINUTES = 1440` / 24 hours).

### 5.3 Authorization & Role-Based Access Control (RBAC)
- Enforced declaratively via FastAPI dependency injection:
  ```python
  @router.post("/trigger", dependencies=[Depends(require_roles(["Administrator"]))])
  async def trigger_etl():
      ...
  ```
- Any unauthorized request receives an immediate `403 Forbidden` response before executing business logic.

### 5.4 Injection Protection & Data Tier Isolation
- **SQL Injection Mitigation:** All database interactions are executed exclusively through SQLAlchemy Core and ORM parameterized statements. Zero raw string concatenation is used in SQL queries.
- **Database Segregation:** The operational database (`hospital_operational.db`) is physically segregated into an isolated file from the analytical warehouse (`hospital_warehouse.db`), preventing analytical query locks from impacting operational writes.

### 5.5 Comprehensive Security Audit Trail
- All administrative, clinical, and data mining operations trigger an asynchronous entry into the `audit_logs` table:
  - Captures: `timestamp`, `user_id`, `username`, `action_name`, `entity_type`, `entity_id`, `ip_address`, and `details_json`.
  - Immutable: The table does not expose update or delete endpoints.

---

## 6. Healthcare Privacy & Synthetic Data Ethics Statement

### 6.1 Safe Harbor De-identification Compliance
This project adheres to the **HIPAA Privacy Rule De-identification Standard (45 CFR § 164.514(b))** via the **Safe Harbor Method**:
1. All 18 categories of direct personal identifiers—including patient names, telephone numbers, Social Security / Medical Record numbers, and detailed geographical indicators—are strictly excluded from analytical warehouse staging.
2. Exact calendar dates of birth are generalized into age brackets (`0-18`, `19-35`, `36-50`, `51-65`, `65+`).

### 6.2 100% Synthetic Data Disclosure
- **Zero Protected Health Information (PHI):** No real patient data, medical records, or hospital clinical files were collected, stored, or utilized in the development or testing of this project.
- **Synthetic Generation Methodology:** All records (patients, doctors, clinical diagnoses, billing transactions) were synthetically generated using deterministic pseudorandom distributions and medical frequency tables anchored to seed `42` (`seed=42`).
- **Reproducibility & Open Research:** The synthetic data ensures total scientific reproducibility for academic evaluation while eliminating any ethical risk of privacy violation or confidentiality breach.
