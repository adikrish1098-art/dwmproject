# Data Warehousing & Mining (DWM) Viva Voce Questions & Answers
**Project:** Hospital Data Warehouse and Patient Analysis Using Data Mining Techniques  
**Target:** Academic Examination, External Reviewers, Technical Project Viva

---

## Category 1: Data Warehousing & Dimensional Modeling Concepts

### Q1: What is a Data Warehouse, and how does it differ fundamentally from an Operational Database?
**Answer:**
A Data Warehouse (OLAP) is a subject-oriented, integrated, time-variant, and non-volatile collection of data organized to support management decision-making. In contrast, an Operational Database (OLTP) is application-oriented, detailed, current-valued, and optimized for high-concurrency, transactional ACID reads and writes. While OLTP uses normalized schemas (3NF) to minimize redundancy and update anomalies, a Data Warehouse employs denormalized dimensional schemas (Star or Snowflake) to maximize query performance for aggregations and historical trend analysis.

### Q2: What is a Star Schema, and why did you choose it over a Snowflake Schema?
**Answer:**
A Star Schema consists of one or more central Fact Tables containing numeric, quantitative business measures referencing multiple denormalized Dimension Tables containing descriptive context via surrogate keys. We chose a Star Schema over a Snowflake Schema because:
1. Dimension tables in a Star Schema are intentionally denormalized, minimizing the number of SQL table `JOIN` operations required for analytical queries.
2. It significantly improves query performance and reduces execution plan complexity for OLAP slice-and-dice aggregations.
3. It provides an intuitive, user-friendly conceptual model for business analysts and reporting tools.

### Q3: What is the difference between a Fact Table and a Dimension Table?
**Answer:**
- **Fact Table:** Represents business measurements, metrics, or events (e.g., patient visits, inpatient admissions, billed amounts). It typically contains numeric additive, semi-additive, or non-additive measures alongside foreign keys that point to dimension tables.
- **Dimension Table:** Contains descriptive attributes that provide context and textual qualifiers for fact measurements (e.g., patient demographics, physician specialties, dates, ICD-10 diagnostic categories). Dimensions answer the *who, what, where, and when* of business events.

### Q4: Explain the difference between Additive, Semi-additive, and Non-additive measures with examples from your project.
**Answer:**
- **Fully Additive:** Measures that can be meaningfully summed across all dimensions. In our `FactBilling` table, `amount_billed` and `amount_paid` are fully additive across time, department, and patient dimensions.
- **Semi-additive:** Measures that can be summed across some dimensions but not all (typically not across the Time dimension). In `FactAdmission`, `length_of_stay` can be summed across departments or patient cohorts, but summing across repeated time intervals for the same ongoing stay leads to double-counting.
- **Non-additive:** Measures that cannot be meaningfully summed across any dimension, such as unit prices, ratios, or percentages (e.g., readmission rate must be calculated as a ratio of sums, not a sum of ratios).

### Q5: What is a Surrogate Key, and why is it preferred over natural business keys in dimensional modeling?
**Answer:**
A surrogate key is an artificially generated integer primary key assigned sequentially by the data warehouse, with no intrinsic business meaning. We use surrogate keys (e.g., `patient_key`, `doctor_key`) instead of natural keys (e.g., `PAT-1001`, `DOC-2001`) because:
1. **Source System Decoupling:** Insulates the warehouse from changes or formatting updates in operational source keys.
2. **SCD Tracking:** Enables tracking multiple historical versions of the same natural entity over time.
3. **Performance Optimization:** Integer keys allow compact B-tree indexing and faster SQL joins compared to alphanumeric string keys.
4. **Integration of Heterogeneous Systems:** Harmonizes entities originating from multiple source systems that may share overlapping natural keys.

### Q6: What are Slowly Changing Dimensions (SCD), and which SCD type did you implement?
**Answer:**
Slowly Changing Dimensions (SCD) are strategies used in dimensional modeling to manage changes to descriptive dimension attributes over time. 
- In this project, we implemented **SCD Type 1 (Overwrite)**. When an attribute changes in the operational database (e.g., a doctor moves to a new department or a patient updates their phone number), the existing record in the warehouse dimension table is updated in-place, and a `last_updated` audit timestamp is refreshed.
- **Rationale:** SCD Type 1 was chosen because our reporting requirements mandate that multi-year historical reports reflect the most current organizational structure without increasing dimension row cardinality.

### Q7: What are Conformed Dimensions, and why are they critical in your warehouse design?
**Answer:**
Conformed dimensions are dimension tables that either mean exactly the same thing with every possible fact table to which they are joined, or are strict subsets of the most granular dimension. In our project, `DimDate`, `DimPatient`, `DimDoctor`, and `DimDepartment` are conformed across all three fact tables (`FactPatientVisit`, `FactAdmission`, `FactBilling`). This permits cross-functional **drill-across** queries—such as correlating an inpatient admission with its subsequent outpatient follow-ups and associated billing invoices.

### Q8: What is a Degenerate Dimension?
**Answer:**
A degenerate dimension is a dimension attribute that is stored directly within a fact table rather than in a separate dimension table, typically because it has no additional descriptive attributes beyond its identifier. In our `FactPatientVisit` table, `source_encounter_id` (e.g., `ENC-5001`) acts as a degenerate dimension, serving as a transaction reference without requiring a dedicated dimension table.

---

## Category 2: OLAP Operations & Multidimensional Analysis

### Q9: Explain the four core OLAP operations implemented in your system.
**Answer:**
1. **Roll-Up:** Performs aggregation along a dimensional hierarchy or eliminates a dimension. For example, aggregating monthly patient readmission counts up to quarterly and yearly totals along the `DimDate` hierarchy (`Day -> Month -> Quarter -> Year`).
2. **Drill-Down:** The inverse of roll-up; breaks down aggregated figures into finer levels of detail. For example, navigating from hospital-wide annual revenue down into departmental and individual physician totals.
3. **Slice:** Performs a selection on one dimension of the cube, producing a two-dimensional sub-cube. For example, selecting only records where `department_name = 'Cardiology'`.
4. **Dice:** Defines a sub-cube by applying selection criteria across two or more dimensions simultaneously (e.g., `Age Group = '65+'` AND `Diagnosis Category = 'Circulatory'` AND `Year = 2026`).

### Q10: What is the difference between ROLAP, MOLAP, and HOLAP? Which one does your system employ?
**Answer:**
- **ROLAP (Relational OLAP):** Stores data in relational tables and computes aggregations on-the-fly using extended SQL queries (`GROUP BY`, window functions).
- **MOLAP (Multidimensional OLAP):** Pre-computes and stores data in optimized multidimensional array data structures (cubes).
- **HOLAP (Hybrid OLAP):** Stores detailed transaction data in relational tables while maintaining aggregate cubes in multidimensional storage.
- **Our Implementation:** Our architecture utilizes **ROLAP**. Queries are executed directly against our relational SQLite star schema tables via SQLAlchemy and optimized SQL queries, avoiding the high storage overhead of pre-computing empty multidimensional sparse matrices.

---

## Category 3: ETL Architecture & Engineering

### Q11: What are the three phases of an ETL pipeline? Explain your implementation of each.
**Answer:**
1. **Extract:** Queries the operational database (`hospital_operational.db`) to identify records inserted or modified since the last ETL execution watermark.
2. **Transform:** 
   - Strips direct identifiers (HIPAA Safe Harbor de-identification).
   - Derives age-group cohorts from dates of birth.
   - Converts calendar timestamps into integer date keys (`YYYYMMDD`).
   - Identifies 30-day readmissions by running a windowed self-join comparing discharge dates with subsequent admission dates for each patient.
   - Maps operational natural keys to warehouse surrogate keys via dimension lookup dictionaries.
3. **Load:** Executes atomic batch inserts and SCD Type 1 upserts into warehouse dimension and fact tables, committing transactions and writing audit metadata to `etl_jobs`.

### Q12: What does "Idempotency" mean in an ETL pipeline, and how did you guarantee it?
**Answer:**
Idempotency means that executing the ETL pipeline multiple times with the same input data produces the exact same warehouse state without creating duplicate records or corrupted aggregations. We guaranteed idempotency by:
1. Enforcing unique natural key constraints in fact tables (e.g., `source_admission_id` and `source_invoice_id` are declared unique).
2. Using database `UPSERT` / `ON CONFLICT DO UPDATE` semantics for dimensions and checking existence before loading facts.
3. Writing unit tests in `tests/test_backend.py` (`test_etl_execution_and_idempotency`) that run the ETL twice consecutively and assert that warehouse row counts remain identical.

---

## Category 4: Data Mining & Machine Learning Algorithms

### Q13: Explain the mathematical working of K-Means clustering and Lloyd's algorithm.
**Answer:**
K-Means partitions $N$ samples into $K$ clusters by minimizing the within-cluster sum of squares (inertia):
$$J = \sum_{k=1}^K \sum_{x_i \in C_k} \| x_i - \mu_k \|^2$$
Lloyd's algorithm alternates between two steps until convergence:
1. **Assignment:** Each sample $x_i$ is assigned to the nearest cluster centroid $\mu_k$ based on minimum Euclidean distance: $c_i = \arg\min_k \|x_i - \mu_k\|^2$.
2. **Update:** Centroids are recomputed as the arithmetic mean of all samples assigned to that cluster: $\mu_k = \frac{1}{|C_k|} \sum_{x_i \in C_k} x_i$.

### Q14: Why is feature standardization essential before applying K-Means clustering?
**Answer:**
K-Means calculates distances using the Euclidean distance metric. If features are measured on drastically different scales (e.g., patient age between 18–90 vs. total billing between $1,000–$50,000), the feature with the largest numerical magnitude will dominate the distance calculations, rendering smaller but clinically critical features negligible. Applying `StandardScaler` ($z = \frac{x - \mu}{\sigma}$) scales every feature to zero mean and unit variance, ensuring equal weight in distance calculations.

### Q15: How did you determine the optimal number of clusters ($K$) in your project?
**Answer:**
We used a dual validation approach:
1. **The Elbow Method:** Plotted within-cluster inertia across $K \in [2, 8]$. The "elbow point" where the rate of inertia decrease sharply flattens indicated $K=3$.
2. **Silhouette Analysis:** Evaluated the silhouette score ($s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$) across multiple $K$ values. $K=3$ achieved the highest score ($>0.42$), confirming cohesive intra-cluster distances and clear separation between clusters.

### Q16: What is the Apriori Property (Downward Closure Property), and why is it important?
**Answer:**
The Apriori property states that *all non-empty subsets of a frequent itemset must also be frequent*. Conversely, if an itemset is infrequent, all of its supersets will inevitably be infrequent. This property is crucial because it drastically reduces the candidate search space from $2^{|I|}$ to a manageable fraction, allowing the algorithm to prune candidate itemsets without performing expensive database scans.

### Q17: Define Support, Confidence, and Lift in Association Rule Mining.
**Answer:**
For an association rule $X \Rightarrow Y$:
- **Support:** Proportion of transactions containing both $X$ and $Y$:
  $$\text{Support}(X \Rightarrow Y) = \frac{\text{Count}(X \cup Y)}{|D|}$$
- **Confidence:** Conditional probability that a transaction contains $Y$ given that it contains $X$:
  $$\text{Confidence}(X \Rightarrow Y) = \frac{\text{Support}(X \cup Y)}{\text{Support}(X)}$$
- **Lift:** Ratio of observed joint frequency to expected frequency under statistical independence:
  $$\text{Lift}(X \Rightarrow Y) = \frac{\text{Support}(X \cup Y)}{\text{Support}(X) \times \text{Support}(Y)}$$
  A Lift $> 1$ indicates a positive, non-random association.

### Q18: How does Logistic Regression work for 30-Day Readmission prediction?
**Answer:**
Logistic Regression is a linear classification model that maps a linear combination of input features $z = w^T x + b$ to a probability between 0 and 1 using the sigmoid activation function:
$$P(y = 1 \mid x) = \sigma(z) = \frac{1}{1 + e^{-z}}$$
The parameters $w$ and $b$ are estimated by minimizing the binary cross-entropy loss function with an $L_2$ regularization penalty:
$$L(w, b) = -\frac{1}{N} \sum_{i=1}^N [y_i \log(\hat{y}_i) + (1 - y_i) \log(1 - \hat{y}_i)] + \frac{\lambda}{2} \|w\|_2^2$$
If $P(y = 1 \mid x) \ge 0.5$, the patient is classified as high-risk for 30-day readmission.

### Q19: Explain the working of Random Forest and why it typically outperforms a single Decision Tree.
**Answer:**
Random Forest is an ensemble learning method combining multiple de-correlated decision trees using **Bootstrap Aggregating (Bagging)** and **Feature Subspace Sampling**:
1. It trains $B$ independent decision trees, each on a distinct bootstrap sample drawn with replacement from the training set.
2. At each node split, it evaluates only a random subset $m \approx \sqrt{P}$ of features, reducing correlation between trees.
3. Predictions are aggregated via majority vote or probability averaging.
- **Superiority over a Single Tree:** While individual decision trees suffer from high variance and easily overfit training noise, averaging across hundreds of randomized trees reduces overall variance while preserving low bias, leading to superior generalization and higher ROC-AUC.

### Q20: What is the difference between Gini Impurity and Entropy? How does a Decision Tree split a node?
**Answer:**
Both are metrics measuring node impurity:
- **Gini Impurity:** $I_G(t) = 1 - \sum_{i=1}^C p_i^2$ (computationally faster as it avoids logarithmic calculations).
- **Entropy:** $I_H(t) = -\sum_{i=1}^C p_i \log_2(p_i)$.
At each node, the decision tree evaluates all candidate features and thresholds to find the split that maximizes the **Information Gain** (reduction in impurity):
$$\Delta I = I(t) - \frac{N_L}{N} I(t_L) - \frac{N_R}{N} I(t_R)$$

### Q21: Why is an explainable Decision Tree critical in healthcare compared to black-box ensemble models?
**Answer:**
In clinical healthcare, high-stakes decisions require clinician trust and regulatory accountability. While ensemble models like Random Forest often provide higher ROC-AUC, they are non-transparent ensembles of hundreds of trees. A pruned Decision Tree (`max_depth=4`) can be directly translated into transparent, deterministic **IF-THEN clinical rules** (e.g., *IF prior admissions > 1 AND stay > 6 days THEN risk = High*), allowing medical staff to understand the clinical rationale behind automated alerts.

### Q22: What is the ROC-AUC metric, and why is it preferred over raw Accuracy for readmission prediction?
**Answer:**
**ROC-AUC (Receiver Operating Characteristic - Area Under Curve)** measures the 2D area under the curve plotting True Positive Rate (Recall) against False Positive Rate across all classification probability thresholds from 0 to 1.
- In hospital readmission datasets, the positive class (readmitted patients) is typically a minority (e.g., 10%–20%). A naive classifier predicting "No Readmission" for every patient would achieve 80%–90% Accuracy while missing 100% of readmitted patients. ROC-AUC is threshold-independent and invariant to class imbalance, accurately assessing the model's true discriminative ability.

---

## Category 5: System Architecture, Security & Governance

### Q23: How does your system enforce Role-Based Access Control (RBAC)?
**Answer:**
RBAC is enforced on the backend at the HTTP router level using FastAPI dependency injection (`require_roles([...])`):
- Every incoming request validates the user's JWT token, decodes their cryptographic role claim, and verifies their privileges before route handler execution.
- Privileges are assigned across four roles:
  - `Administrator`: Full system administration, ETL triggers, user provisioning, audit inspection.
  - `Doctor`: Patient records, admissions, appointments, clinical diagnoses, readmission inference.
  - `Receptionist`: Patient registration, appointment scheduling, billing invoices.
  - `Data Analyst`: Dimensional warehouse explorer, OLAP cubes, data mining models, report exports.

### Q24: How does your system comply with HIPAA de-identification standards?
**Answer:**
Under the HIPAA Privacy Rule's **Safe Harbor method**, 18 direct personal identifiers must be removed to render healthcare data de-identified. In our system:
1. Direct identifiers (full patient names, phone numbers, exact residential addresses, and national IDs) are stripped during the ETL extraction phase before warehouse staging.
2. Exact dates of birth are generalized into categorical age cohorts (`0-18`, `19-35`, `36-50`, `51-65`, `65+`).
3. Only anonymized surrogate keys and derived clinical indicators are exposed to the analytical warehouse and data mining engines.

### Q25: Why did you use synthetic data with a fixed random seed (`seed=42`)?
**Answer:**
We used synthetic healthcare data generated with a deterministic pseudorandom seed (`seed=42`) for two reasons:
1. **Ethics & Privacy:** Guarantees zero risk of Protected Health Information (PHI) exposure or patient confidentiality breach.
2. **Scientific Reproducibility:** Guarantees that all reviewers, examiners, and automated test suites reproduce identical record counts, clustering boundaries, association rules, and model evaluation metrics across any environment.
