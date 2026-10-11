# System Architecture: Hospital Data Warehouse and Patient Analysis

## 1. Architectural Overview

The **Hospital Data Warehouse and Patient Analysis** platform is designed using a multi-tiered, separated-concern architecture. It integrates operational clinical management, asynchronous ETL processing, dimensional analytical data warehousing, and machine learning/data mining analytical pipelines into a cohesive single-page application.

```mermaid
graph TB
    subgraph ClientLayer["Frontend Layer (Client)"]
        UI["React 18 + TypeScript SPA"]
        Router["React Router v6"]
        Recharts["Recharts & Lucide UI"]
        AuthContext["Auth State & RBAC Context"]
    end

    subgraph APILayer["Backend & API Layer (FastAPI)"]
        Gateway["FastAPI Application Gateway"]
        Security["JWT & Argon2 / Bcrypt Auth"]
        RBAC["Role-Based Access Guard"]
        APIRouters["REST API Routers (Clinical, Warehouse, Mining, ML)"]
    end

    subgraph StorageLayer["Data Storage Architecture"]
        subgraph OperationalDB["Operational Database (OLTP)"]
            Users["Users & Auth Logs"]
            Clinical["Patients, Doctors, Departments"]
            Visits["Appointments & Admissions"]
            Financial["Billing & Invoices"]
        end
        subgraph WarehouseDB["Analytical Warehouse (OLAP)"]
            Dimensions["DimPatient, DimDoctor, DimDepartment, DimDiagnosis, DimDate, DimEncounter"]
            Facts["FactPatientVisit, FactAdmission, FactBilling"]
            ETLLogs["ETL Job History & Data Quality Logs"]
        end
    end

    subgraph ProcessingEngines["Data Mining & Analytics Engines"]
        ETL["ETL Pipeline (Extract, Clean, Watermark, Star Load)"]
        Clustering["K-Means Clustering Engine (Scikit-Learn)"]
        Apriori["Apriori Association Engine (mlxtend)"]
        Predictor["30-Day Readmission Predictor (Logistic, Random Forest)"]
        DecisionTree["Decision Tree Classifier with Rule Explanations"]
    end

    UI --> Gateway
    Gateway --> Security --> RBAC --> APIRouters
    APIRouters --> OperationalDB
    APIRouters --> WarehouseDB
    APIRouters --> ProcessingEngines
    ETL --> OperationalDB
    ETL --> WarehouseDB
    ProcessingEngines --> WarehouseDB
```

---

## 2. Detailed Data Flow Architecture

The data lifecycle transitions from operational event generation to dimensional warehousing and machine learning models:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Hospital Admin / Receptionist
    actor Analyst as Data Analyst
    participant Frontend as React Web Client
    participant API as FastAPI Backend
    participant OLTP as Operational DB (hospital_operational.db)
    participant ETL as ETL Pipeline Engine
    participant OLAP as Data Warehouse (hospital_warehouse.db)
    participant ML as ML & Data Mining Engine

    Admin->>Frontend: Register Patient / Schedule Admission / Issue Bill
    Frontend->>API: POST /api/v1/patients or /admissions
    API->>OLTP: Insert transactional records (ACID commit)
    OLTP-->>API: Success confirmation
    API-->>Frontend: Operational confirmation

    Analyst->>Frontend: Trigger ETL Execution
    Frontend->>API: POST /api/v1/etl/run
    API->>ETL: Execute extract_and_load_warehouse()
    ETL->>OLTP: Extract delta/watermarked records
    ETL->>ETL: Cleanse, impute, deduplicate, calculate features
    ETL->>OLAP: Load Dimensions (Type 1 SCD) followed by Fact tables
    OLAP-->>ETL: Load summary (success/failure counts)
    ETL-->>API: Store ETL execution audit log
    API-->>Frontend: ETL Pipeline report

    Analyst->>Frontend: Request K-Means / Apriori / Readmission ML
    Frontend->>API: POST /api/v1/mining/cluster or /ml/readmission/train
    API->>ML: Fetch de-identified dataset from OLAP
    ML->>ML: Train model, evaluate cross-validation, calculate metrics
    ML-->>API: Return cluster centers, association rules, ROC/AUC metrics
    API-->>Frontend: Render interactive Recharts visualizations
```

---

## 3. Layer Separation & Security Boundaries

1. **Presentation Layer**:
   - Single Page Application built on React 18, Vite, TypeScript, and Tailwind CSS.
   - Client-side route guarding based on user roles (`Administrator`, `Doctor`, `Receptionist`, `Data Analyst`).
   - Secure token handling with optional HttpOnly cookie storage and generic error boundaries.

2. **Service & API Layer**:
   - Built on FastAPI with asynchronous routing and strict Pydantic schemas.
   - Parameterized ORM queries via SQLAlchemy 2.0 preventing SQL injection.
   - Role-Based Access Control (RBAC) enforced via FastAPI dependency injection (`get_current_active_user`, `require_roles`).

3. **Data Storage Layer**:
   - **Operational Store**: Normalized relational schema (3NF) optimized for transactional integrity, foreign key enforcement, and concurrent appointments/admissions.
   - **Analytical Data Warehouse**: Dimensional Star Schema optimized for OLAP aggregations (roll-up, drill-down, slice, dice, pivot).

4. **Analytics & Machine Learning Layer**:
   - Feature engineering isolated from operational identifiers.
   - Data leakage prevention (train/test split separated by unique patient ID to avoid leakage across multiple admissions).
   - Apriori algorithm for market-basket diagnosis co-occurrence mining.
   - Model comparison suite comparing Baseline Dummy, Logistic Regression, Random Forest, and Decision Tree.

---

## 4. Production Scalability Roadmap

For a production deployment, the educational SQLite dual-database setup transitions as follows:
- **Operational Database**: Migrate from SQLite to **PostgreSQL 16** with replication and connection pooling (PgBouncer).
- **Data Warehouse**: Migrate star schema to **ClickHouse**, **Snowflake**, or **Amazon Redshift** for columnar analytical query execution.
- **ETL Orchestration**: Transition the in-process Python pipeline to **Apache Airflow** or **Prefect** with daily/hourly scheduled DAGs.
- **Model Serving**: Store trained Scikit-learn pipelines in an **MLflow** model registry.
