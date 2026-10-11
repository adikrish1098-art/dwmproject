# Final Project Presentation Outline & Speaker Script
**Project:** Hospital Data Warehouse and Patient Analysis Using Data Mining Techniques  
**Presentation Duration:** 12–15 Minutes | **Target Audience:** Academic Examiners, Project Evaluation Committee

---

## Slide 1: Title Slide & Introduction
- **Slide Title:** Hospital Data Warehouse & Patient Analysis Using Data Mining Techniques
- **Visuals:** Project title, student names, department, institutional emblem, system architecture badge.
- **Key Bullets:**
  - Full-Stack Dual Database Architecture (OLTP + OLAP).
  - Ralph Kimball Star Schema Dimensional Modeling.
  - Unsupervised Mining (K-Means, Apriori) & Supervised ML (Readmission Prediction, Decision Tree).
  - Production-Grade Web Interface (21 Modular Views, FastAPI, React 18, TypeScript).
- **Speaker Script:**
  > "Good morning, respected examiners and faculty members. Today, we present our Data Warehousing and Mining mini project: a complete, end-to-end Hospital Data Warehouse and Patient Analysis System. Our project bridges high-throughput clinical operations with dimensional analytics and predictive machine learning to reduce 30-day hospital readmissions and uncover diagnostic patterns."

---

## Slide 2: Problem Statement & Clinical Motivation
- **Slide Title:** The Healthcare Dilemma: Operational Silos vs. Analytical Intelligence
- **Visuals:** Split diagram comparing operational relational databases struggling with heavy analytical queries vs. an isolated analytical data warehouse.
- **Key Bullets:**
  - *Operational Bottlenecks:* OLTP systems are optimized for transactions; running multi-year analytical queries degrades hospital operations.
  - *The Readmission Challenge:* Unplanned 30-day hospital readmissions incur severe financial penalties and signal preventable complications.
  - *Fragmented Analytics:* Hospitals often lack an automated bridge from raw EHR logs to explainable decision support.
- **Speaker Script:**
  > "In standard healthcare systems, transactional databases are built for rapid ACID updates—recording an admission or settling an invoice. However, answering strategic questions like 'Which elderly chronic patients are at risk of readmission within 30 days?' requires scanning millions of historical records, causing severe performance degradation. Our objective was to construct an autonomous data warehouse fed by an idempotent ETL pipeline, powering advanced data mining models without compromising clinical operations."

---

## Slide 3: System Architecture & Tech Stack
- **Slide Title:** 3-Tier Enterprise Architecture
- **Visuals:** 3-tier system diagram showing React frontend, FastAPI backend, and dual SQLite database engines.
- **Key Bullets:**
  - *Presentation Tier:* React 18, TypeScript, Tailwind CSS, Lucide Icons, Recharts (21 views).
  - *Application Tier:* FastAPI, Pydantic v2, Scikit-learn, Pandas, PBKDF2 Auth & RBAC.
  - *Data Tier:* Dual SQLite databases: `hospital_operational.db` (OLTP 3NF) and `hospital_warehouse.db` (OLAP Star Schema).
- **Speaker Script:**
  > "Our system follows a robust three-tier architecture. On the client side, we built a modern single-page application in React 18 and TypeScript with 21 dedicated functional views. On the backend, FastAPI delivers high-performance asynchronous REST APIs secured with dual cookie/bearer JWT authentication and strict Role-Based Access Control. At the data layer, we cleanly separate our operational transactions from our dimensional data warehouse."

---

## Slide 4: Dimensional Modeling & Kimball Star Schema
- **Slide Title:** Analytical Star Schema Design
- **Visuals:** Star schema ER diagram highlighting conformed dimensions surrounding three central fact tables.
- **Key Bullets:**
  - *Conformed Dimensions:* `DimDate`, `DimPatient`, `DimDoctor`, `DimDepartment`, `DimDiagnosis`, `DimEncounter`.
  - *Multi-Grain Fact Tables:*
    - `FactPatientVisit` (Encounter Grain): Captures consultation volumes and diagnostic flows.
    - `FactAdmission` (Inpatient Stay Grain): Tracks length of stay and 30-day readmissions.
    - `FactBilling` (Financial Grain): Tracks billed amounts, collections, and outstanding balances.
  - *SCD Type 1 Strategy:* In-place dimension overwrites preserving surrogate keys.
- **Speaker Script:**
  > "For our analytical storage, we adopted Ralph Kimball’s dimensional modeling methodology. At the center of our star schema are three fact tables addressing distinct business grains: outpatient visits, inpatient admissions, and financial billing. These facts share six conformed dimensions. We utilize integer surrogate keys, such as YYYYMMDD for the date dimension, and implement SCD Type 1 to maintain current master data while preserving historical referential integrity."

---

## Slide 5: Automated & Idempotent ETL Pipeline
- **Slide Title:** Automated ETL Pipeline & Change Data Capture
- **Visuals:** Data flow diagram: Extract -> Transform (Cleanse, De-identify, Calculate Readmissions) -> Load (Upsert into Star Schema).
- **Key Bullets:**
  - *Extract:* Incremental delta extraction using timestamp watermarks.
  - *Transform:* Safe Harbor de-identification, age-cohort binning, windowed readmission detection.
  - *Load:* Idempotent batch insertion with SCD Type 1 upserts.
  - *Auditability:* Every execution logged with runtime, record counts, and error tallies in `etl_jobs`.
- **Speaker Script:**
  > "A data warehouse is only as reliable as its ETL pipeline. Our automated pipeline extracts new records from the operational tables, anonymizes sensitive patient identifiers, computes complex derived measures—such as calculating whether a discharge was followed by an admission within 30 days—and loads clean data into the star schema. Crucially, our pipeline is completely idempotent: running the ETL multiple times will never duplicate warehouse records."

---

## Slide 6: Multidimensional OLAP Cubes & Analysis
- **Slide Title:** OLAP Slicing, Dicing & Aggregations
- **Visuals:** Screenshot / graphic of OLAP Cube Explorer showing roll-up/drill-down hierarchies and sliced heatmaps.
- **Key Bullets:**
  - *Roll-Up / Drill-Down:* Navigating temporal hierarchies (Day -> Month -> Quarter -> Year).
  - *Slice:* Isolating specific department cohorts (e.g., Cardiology readmission rates).
  - *Dice:* Multi-criteria analysis (e.g., Age 65+ patients with Circulatory disorders in 2026).
  - *Pivot:* Rotating dimensions for cross-tabulated length of stay and financial comparisons.
- **Speaker Script:**
  > "With our star schema populated, the warehouse enables interactive OLAP operations. Users can roll up monthly readmissions into quarterly hospital-wide KPIs, drill down into individual physician specialties, slice the cube to examine high-risk departments, and dice across multiple dimensions like age and diagnosis category. These queries execute in milliseconds due to pre-indexed surrogate keys."

---

## Slide 7: Unsupervised Data Mining: K-Means Clustering
- **Slide Title:** Patient Segmentation via K-Means Clustering
- **Visuals:** 2D scatter plot of patient clusters (Age vs. Length of Stay / Billing) alongside the Elbow Method inertia curve.
- **Key Bullets:**
  - *Algorithm:* Lloyd's algorithm with K-Means++ initialization and Euclidean distance metric.
  - *Feature Vector:* Age, cumulative length of stay, total billing, visit frequency (standardized via `StandardScaler`).
  - *Optimal K:* Determined via Elbow method and Silhouette analysis ($K=3$, Silhouette score: 0.42+).
  - *Identified Cohorts:* Low-risk outpatients, moderate acute inpatients, and high-utilization chronic elderly patients.
- **Speaker Script:**
  > "Moving to data mining: our first technique is unsupervised patient segmentation using K-Means clustering. By standardizing patient age, length of stay, total billing, and visit frequency, our model groups patients into three distinct clinical clusters. Cluster 2 clearly identifies high-utilization elderly patients with extensive hospital stays and chronic conditions, allowing hospital administrators to target proactive care management."

---

## Slide 8: Association Rule Mining: Apriori Algorithm
- **Slide Title:** Clinical Comorbidity Mining with Apriori
- **Visuals:** Network or tabular display of top association rules with Support, Confidence, and Lift indicators.
- **Key Bullets:**
  - *Objective:* Discover recurring co-morbidities across encounter diagnosis baskets.
  - *Metrics:* Support (frequency), Confidence (conditional probability), Lift (strength of correlation).
  - *Pruning:* Exploits downward closure property to prune infrequent itemset candidates.
  - *Key Discovery:* Strong correlation between Type 2 Diabetes and Essential Hypertension ($\text{Lift} = 1.84, \text{Confidence} = 78.2\%$).
- **Speaker Script:**
  > "Next, we implemented Apriori association rule mining to uncover clinical comorbidities. Treating each patient encounter as a diagnostic transaction, our algorithm identifies frequently co-occurring ICD-10 conditions. For example, our model reveals that patients diagnosed with Type 2 Diabetes have an 78.2% probability of co-occurring Essential Hypertension, with a Lift of 1.84, indicating a strong positive correlation that informs preventive clinical screenings."

---

## Slide 9: Supervised Machine Learning: 30-Day Readmission Prediction
- **Slide Title:** Predictive Modeling for 30-Day Readmissions
- **Visuals:** Side-by-side ROC curves and feature importance bar chart comparing Logistic Regression and Random Forest.
- **Key Bullets:**
  - *Framing:* Supervised binary classification on patient admission features.
  - *Models:* Regularized Logistic Regression ($L_2$ penalty) vs. Random Forest Classifier (100 estimators, depth=8).
  - *Feature Engineering:* Age, length of stay, prior admissions count, emergency admission flag, procedure count.
  - *Leading Predictors:* Inpatient length of stay, prior 365-day admission count, and patient age represent over 65% of feature importance.
- **Speaker Script:**
  > "To proactively tackle readmissions, we trained supervised machine learning models to predict 30-day readmission risk at the point of discharge. We engineered seven clinical features and benchmarked regularized Logistic Regression against an ensemble Random Forest classifier. Random Forest achieved superior discrimination, and feature importance analysis confirmed that prior admissions and index length of stay are the most critical risk drivers."

---

## Slide 10: Model Comparison & Explainable Decision Tree
- **Slide Title:** Benchmark Evaluation & Interpretable Clinical Rules
- **Visuals:** Model comparison scorecard (Accuracy, Precision, Recall, F1, ROC-AUC) plus an interactive Decision Tree diagram.
- **Key Bullets:**
  - *Performance Comparison:* Random Forest achieved ~84.2% ROC-AUC and 81.5% Accuracy, outperforming Logistic Regression (~78.6% ROC-AUC).
  - *Clinical Explainability:* Pruned Decision Tree (`max_depth=4`) extracts human-readable IF-THEN clinical rules.
  - *Actionable Rules:* Identifies high-risk rule: Prior Admissions $> 1.5$ AND Length of Stay $> 6.5$ days yields $78.4\%$ readmission probability.
- **Speaker Script:**
  > "In high-stakes healthcare, models cannot simply be black boxes. While Random Forest delivered our highest predictive accuracy and ROC-AUC, we also trained a pruned Decision Tree specifically for clinical interpretability. This model generates deterministic IF-THEN clinical rules. For instance, an elderly patient with more than one prior admission and a stay exceeding 6.5 days triggers an immediate high-risk alert, recommending dedicated post-discharge care coordination."

---

## Slide 11: Live Demonstration Walkthrough Script
- **Slide Title:** Interactive Platform Demonstration
- **Visuals:** Flowchart of 5-step live demonstration.
- **Key Demo Flow:**
  1. *Authentication & RBAC:* Log in as Administrator; demonstrate restricted views when switching to Receptionist.
  2. *Operational Transactions:* Schedule an appointment and admit an inpatient.
  3. *ETL Execution:* Trigger the ETL pipeline from the UI; verify atomic delta load and zero duplicate warnings.
  4. *Star Schema & OLAP:* Inspect conformed dimensions and slice readmissions across departments.
  5. *Live Risk Inference:* Input patient parameters into the interactive prediction calculator; observe instant probability score and risk badge.
- **Speaker Script:**
  > "We will now demonstrate the live application. We first log in under our Administrator account, showcasing our role-based navigation. Next, we record an inpatient admission, execute the ETL pipeline to see our star schema dynamically update with full idempotency, explore our multidimensional OLAP cubes, and finally evaluate real-time readmission risk using our live inference calculator."

---

## Slide 12: Conclusion, Impact & Future Enhancements
- **Slide Title:** Project Summary & Future Scope
- **Visuals:** Key project metrics: 2 dual databases, 18 automated tests passing, 21 functional views, reproducible seed.
- **Key Bullets:**
  - *Achievements:* Fully operational, production-ready healthcare DWM platform adhering to academic standards.
  - *Compliance & Ethics:* 100% synthetic dataset (`seed=42`) ensuring zero privacy violations.
  - *Future Enhancements:* Distributed cloud warehouse integration (Snowflake / ClickHouse), real-time HL7/FHIR streaming, NLP for clinical notes.
- **Speaker Script:**
  > "To conclude: our project proves that combining Kimball dimensional data warehousing with modern data mining techniques provides hospital leadership and clinicians with actionable, explainable intelligence to improve patient outcomes. All 18 automated test suites pass, the platform is fully responsive and documented, and the codebase is completely reproducible. Thank you, and we welcome your questions."
