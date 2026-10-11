# College Project Report Outline & Presentation Guide

## Hospital Data Warehouse and Patient Analysis Using Data Mining Techniques

---

## Part 1: Comprehensive Project Report Structure

### Chapter 1: Introduction
1.1 **Background**: Evolution of healthcare informatics from manual record-keeping to clinical decision support systems.
1.2 **Problem Statement**: Healthcare facilities face fragmented operational databases that hinder cross-departmental analytics, delayed resource planning, and lack of preventive 30-day readmission insights.
1.3 **Objectives**:
- Build a full-stack integrated hospital operations portal.
- Implement a dual-database architecture separating OLTP transactions from an OLAP dimensional data warehouse.
- Construct an idempotent ETL pipeline with automated cleansing and dimension-first loading.
- Deploy machine learning algorithms (K-Means, Apriori, Decision Trees, Logistic Regression, Random Forest).
- Provide role-based access control and interactive BI dashboards.
1.4 **Scope & Limitations**: Educational demonstration using synthetic data adhering to data minimization principles.

### Chapter 2: Literature Survey & Related Work
2.1 Traditional Relational Databases vs. Modern Dimensional Data Warehousing (Kimball vs. Inmon methodologies).
2.2 Survey of Healthcare Star Schemas and Fact-Dimension grain modeling.
2.3 Clinical Association Rule Mining: Use of Apriori for diagnosis co-occurrence.
2.4 Machine Learning for Inpatient Readmission Prediction: Challenges with class imbalance and data leakage.

### Chapter 3: System Requirements & Architecture
3.1 Functional Requirements (Authentication, Clinical Management, ETL, Mining, Reporting).
3.2 Non-Functional Requirements (Security, Idempotency, Performance, Scalability).
3.3 Technology Stack Justification (FastAPI, React 18, TypeScript, Tailwind, SQLAlchemy, Scikit-learn, mlxtend).
3.4 Multi-Tier Architecture & Data Flow Diagrams.

### Chapter 4: Database & Warehouse Design
4.1 Operational Relational Database Schema (ER Diagram, Normalization to 3NF).
4.2 Analytical Data Warehouse Design (Star Schema, Fact tables, Dimension tables).
4.3 Fact Grain Specification and Additivity Analysis.
4.4 Surrogate Key Generation and Slowly Changing Dimension (SCD Type 1) Strategy.

### Chapter 5: ETL Pipeline Implementation
5.1 Extraction from Operational Datasets & CSV Sources.
5.2 Transformation: Missing value imputation, date normalization, categorical encoding, business rule validations.
5.3 Loading: Dimension table upserts, fact record population, transaction management, and execution logging.
5.4 Data Quality Auditing and Idempotency Verification.

### Chapter 6: Data Mining & Machine Learning Pipeline
6.1 Unsupervised Patient Clustering: K-Means, Elbow Method, Silhouette Analysis, PCA projection.
6.2 Association Rule Mining: Encounter transactions, Apriori frequent itemsets, Support, Confidence, Lift.
6.3 Supervised 30-Day Readmission Prediction:
- Target definition & chronological encounter linkage.
- Patient-level grouped train/test splitting (data leakage prevention).
- Model comparison: DummyClassifier, Logistic Regression, Random Forest, Decision Tree.
- Evaluation metrics: Accuracy, Precision, Recall, F1-Score, ROC-AUC, PR-AUC.

### Chapter 7: Results, Visualization & Discussion
7.1 Hospital KPI Executive Dashboard.
7.2 OLAP SQL Analytics & Slice/Dice Explorations.
7.3 Clinical Co-occurrence Insights from Association Mining.
7.4 Model Performance Trade-Off Analysis.

### Chapter 8: Conclusion & Future Enhancements
8.1 Summary of Deliverables.
8.2 Future Scope: Cloud migration (Snowflake/BigQuery), FHIR API integration, real-time streaming ETL.

---

## Part 2: 12-Slide Presentation Outline

- **Slide 1: Title Slide**: Project Name, Student Name, Roll Number, Department, Guide Name.
- **Slide 2: Problem Statement & Motivation**: Operational fragmentation vs. Analytical intelligence in modern healthcare.
- **Slide 3: Project Objectives & Scope**: Full-stack platform combining management, warehousing, and predictive data mining.
- **Slide 4: System Architecture**: Multi-tier diagram (React SPA $\rightarrow$ FastAPI Gateway $\rightarrow$ OLTP / OLAP $\rightarrow$ ML Engine).
- **Slide 5: Database Architecture**: Comparison between 3NF Operational Schema and Analytical Star Schema.
- **Slide 6: ETL Pipeline Architecture**: Extract, Transform (Cleanse & Validate), Load (Dimensions $\rightarrow$ Facts), Idempotency.
- **Slide 7: OLAP Capabilities & SQL Analytics**: Roll-up, Drill-down, Slice, Dice, and Pivot demonstration.
- **Slide 8: Unsupervised Learning (K-Means Clustering)**: Patient segmentation, Elbow curve, Silhouette score, 2D PCA clusters.
- **Slide 9: Association Rule Mining (Apriori)**: Diagnosis co-occurrence mining, Support vs Confidence vs Lift analysis.
- **Slide 10: 30-Day Readmission Prediction**: Data leakage prevention, Feature engineering, Decision Tree interpretability.
- **Slide 11: Model Comparison Dashboard**: Baseline vs. Logistic vs. Random Forest vs. Decision Tree performance matrix.
- **Slide 12: Conclusion & Viva Takeaways**: Architectural summary, Security best practices, and Future work.

---

## Part 3: Troubleshooting Guide

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| **Port 8000 already in use** | A previous FastAPI instance is still running in background. | Run `lsof -ti:8000 \| xargs kill -9` before restarting `uvicorn`. |
| **Database file locked (`sqlite3.OperationalError: database is locked`)** | Multiple threads attempting concurrent writes without WAL mode. | SQLite initialization enables WAL mode (`PRAGMA journal_mode=WAL;`). Restart backend. |
| **Frontend fails to connect to API** | Backend server is offline or CORS origin mismatch. | Ensure backend is running at `http://127.0.0.1:8000` and `frontend/.env` points to this URL. |
| **Pytest module import error** | `PYTHONPATH` not including project backend directory. | Run tests using: `source backend/venv/bin/activate && PYTHONPATH=backend pytest backend/tests`. |
| **JWT Token Expired** | Access token validity exceeded (default 60 mins). | Log out and log back in, or renew token using the refresh endpoint. |

---

## Part 4: Security and Limitations Documentation

### Security Implementation
1. **Password Hashing**: Uses Argon2 / Bcrypt key derivation with automated salting.
2. **Access Control**: Server-side Role-Based Access Control (RBAC) enforced on every API route using FastAPI dependencies.
3. **Data Minimization**: Direct identifiers (names, contact details) are excluded from all analytical datasets and model features.
4. **Parameterization**: Parameterized queries through SQLAlchemy prevent SQL injection.
5. **Anti-Enumeration**: Authentication endpoints return generic credentials failure messages.

### Limitations & Regulatory Disclaimer
- **Educational Scope**: Designed for undergraduate academic demonstration.
- **Not a Production Medical Device**: Machine learning predictions are synthetic demonstrations and must never be used for real clinical diagnosis or treatment planning.
- **Compliance**: Does not claim formal HIPAA or GDPR certification without an enterprise infrastructure and formal clinical audit.
