# Data Mining & Machine Learning Algorithms Guide

This document details the mathematical foundations, preprocessing pipelines, parameter configurations, and evaluation metrics for all analytical algorithms implemented in the **Hospital Data Warehouse & Patient Analysis** platform.

---

## 1. Patient Clustering using K-Means

### 1.1 Objective & Educational Scope
K-Means clustering partitions heterogeneous patient populations into distinct operational subgroups based on continuous healthcare utilization indicators. It enables the hospital administration to understand usage patterns without human supervision.

> **Important Disclaimer**: Clustering groups records based purely on mathematical distance in normalized feature space. Clusters reflect **statistical utilization patterns**, not clinical risk categories or diagnostic conditions.

### 1.2 Mathematical Formulation
Given a set of $n$ de-identified patient utilization vectors $\{x_1, x_2, \dots, x_n\} \in \mathbb{R}^d$, K-Means partitions the observations into $k$ non-overlapping clusters $S = \{S_1, S_2, \dots, S_k\}$ by minimizing the Within-Cluster Sum of Squares (WCSS) / Inertia:

$$\operatorname{WCSS} = \sum_{i=1}^{k} \sum_{x \in S_i} \|x - \mu_i\|^2$$

where $\mu_i$ is the centroid (mean vector) of cluster $S_i$:
$$\mu_i = \frac{1}{|S_i|} \sum_{x \in S_i} x$$

### 1.3 Preprocessing & Feature Engineering
1. **Feature Selection**:
   - `age`: Patient biological age in years.
   - `visit_frequency`: Historical outpatient consultation count.
   - `length_of_stay`: Aggregate or average hospital stay duration.
   - `previous_admissions`: Prior inpatient encounter tally.
   - `total_billed_amount`: Aggregate hospital billing amount in currency.
2. **Missing Value Imputation**: Imputed using column medians to protect against outlier skews.
3. **Standardization**: StandardScaler normalizes features to zero mean and unit variance:
   $$z = \frac{x - \mu}{\sigma}$$
   Ensuring variables with large nominal scales (e.g., billing amount) do not artificially dominate Euclidean distance calculations.

### 1.4 Determining Optimal $k$
- **Elbow Method**: Tracks WCSS reduction across $k \in [2, 10]$. The "elbow" marks the inflection point where additional clusters yield diminishing returns in variance reduction.
- **Silhouette Coefficient**:
   $$s(i) = \frac{b(i) - a(i)}{\max(a(i), b(i))}$$
   Measures compactness within cluster $a(i)$ versus separation from nearest neighbor cluster $b(i)$. Values range from $[-1, 1]$, with values $>0.4$ indicating well-separated clusters.
- **PCA Projection**: Principal Component Analysis reduces high-dimensional standardized features to 2 principal components ($PC_1, PC_2$) for 2D scatter visualization.

---

## 2. Association Rule Mining using Apriori

### 2.1 Objective
Discovers frequent co-occurrences of diagnosis categories, treatment regimens, and hospital services within the same clinical encounter.

### 2.2 Transaction Construction
Each encounter is treated as a single "basket" or transaction $T = \{i_1, i_2, \dots, i_m\}$ containing discrete codes (e.g., `{Hypertension, Type 2 Diabetes, Cardiology Consultation}`).

### 2.3 Key Metrics
For an association rule of the form $X \implies Y$ (where $X \cap Y = \emptyset$):

1. **Support**: Probability of encounter containing both itemsets:
   $$\operatorname{Support}(X \implies Y) = P(X \cup Y) = \frac{|\{T \mid X \cup Y \subseteq T\}|}{|D|}$$
2. **Confidence**: Conditional probability that encounter contains $Y$ given it contains $X$:
   $$\operatorname{Confidence}(X \implies Y) = P(Y \mid X) = \frac{\operatorname{Support}(X \cup Y)}{\operatorname{Support}(X)}$$
3. **Lift**: Strength of association over random statistical independence:
   $$\operatorname{Lift}(X \implies Y) = \frac{\operatorname{Confidence}(X \implies Y)}{\operatorname{Support}(Y)} = \frac{P(X \cup Y)}{P(X) \cdot P(Y)}$$
   - $\operatorname{Lift} = 1$: $X$ and $Y$ are completely independent.
   - $\operatorname{Lift} > 1$: Positive correlation (co-occur more frequently than chance).
   - $\operatorname{Lift} < 1$: Negative correlation / substitution.

---

## 3. 30-Day Readmission Prediction & ML Pipeline

### 3.1 Problem Definition & Target
- **Target Variable**: $Y \in \{0, 1\}$
  - $Y = 1$: Patient has a subsequent qualifying hospital admission within 30 calendar days of discharge.
  - $Y = 0$: No qualifying readmission within 30 days.

### 3.2 Data Leakage Safeguards
1. **Temporal Boundaries**: Features are calculated strictly using clinical facts known *at or before* the time of discharge. Future labs, future bills, and post-discharge appointments are rigorously excluded.
2. **Patient-Level Group Splitting**: When patients have multiple historical hospital stays, standard row-level random splitting causes data leakage (a patient's records appear in both train and test sets). Our pipeline uses **Patient-Group Stratified Splitting** (`GroupShuffleSplit` / Grouped K-Fold by `patient_id`), guaranteeing unseen patients in the evaluation holdout set.

### 3.3 Models Compared
1. **DummyClassifier (Baseline)**: Stratified or most-frequent baseline predicting the empirical majority class distribution.
2. **Logistic Regression (L2 Regularized)**: Interpretable linear baseline with sigmoid activation and probability calibration.
3. **Random Forest Classifier**: Ensemble of 100 decorrelated decision trees with bootstrap aggregation (`bagging`) and random feature subspace sampling.
4. **Decision Tree Classifier (CART)**: Transparent tree model with configurable max-depth, min-samples-split, and Gini / Entropy splitting criteria.

### 3.4 Evaluation Metrics
- **Accuracy**: $\frac{TP + TN}{TP + TN + FP + FN}$ (monitored alongside class imbalance).
- **Precision**: $\frac{TP}{TP + FP}$ (proportion of predicted readmissions that truly readmitted).
- **Recall / Sensitivity**: $\frac{TP}{TP + FN}$ (proportion of actual readmissions detected).
- **F1-Score**: Harmonic mean of precision and recall: $\frac{2 \cdot P \cdot R}{P + R}$.
- **ROC-AUC**: Area under the Receiver Operating Characteristic curve. Evaluates discriminatory power across all classification thresholds.
- **PR-AUC**: Area under Precision-Recall curve, essential for imbalanced medical outcome datasets.
