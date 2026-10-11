import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.metrics import silhouette_score
from app.core.database import OperationalSessionLocal
from app.models.operational import Patient, Admission, Invoice, Encounter

def get_clustering_dataset() -> pd.DataFrame:
    """
    Extracts and aggregates patient-level feature vectors from operational database:
    - Age
    - Total Visits (Encounters count)
    - Total Admissions count
    - Total Length of Stay (sum)
    - Average Length of Stay
    - Total Billed Amount (sum)
    """
    db = OperationalSessionLocal()
    try:
        from sqlalchemy import text
        query = text("""
            SELECT 
                p.id AS patient_id,
                CAST(p.age AS FLOAT) AS age,
                CAST(COUNT(DISTINCT e.id) AS FLOAT) AS total_visits,
                CAST(COUNT(DISTINCT a.id) AS FLOAT) AS total_admissions,
                CAST(COALESCE(SUM(a.length_of_stay), 0) AS FLOAT) AS total_los,
                CAST(COALESCE(AVG(a.length_of_stay), 0.0) AS FLOAT) AS avg_los,
                CAST(COALESCE((SELECT SUM(amount_billed) FROM invoices inv WHERE inv.patient_id = p.id), 0.0) AS FLOAT) AS total_billed
            FROM patients p
            LEFT JOIN encounters e ON e.patient_id = p.id
            LEFT JOIN admissions a ON a.patient_id = p.id
            WHERE p.is_active = 1
            GROUP BY p.id, p.age
        """)
        result = db.execute(query).fetchall()
        data = [
            {
                "patient_id": row[0],
                "age": float(row[1] or 0),
                "total_visits": float(row[2] or 0),
                "total_admissions": float(row[3] or 0),
                "total_los": float(row[4] or 0),
                "avg_los": float(row[5] or 0),
                "total_billed": float(row[6] or 0)
            }
            for row in result
        ]
        return pd.DataFrame(data)
    finally:
        db.close()

def run_kmeans_clustering(k: int = 3, feature_cols: Optional[List[str]] = None) -> Dict[str, Any]:
    """
    Executes K-Means Clustering on patient features.
    Computes Elbow curve, Silhouette scores, PCA 2D projections, and cluster profiles.
    """
    df = get_clustering_dataset()
    if df.empty:
        return {"error": "Dataset is empty"}
    
    if not feature_cols:
        feature_cols = ["age", "total_visits", "total_admissions", "avg_los", "total_billed"]
    
    # Feature selection & standardization
    X = df[feature_cols].copy()
    X = X.fillna(X.mean())
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # 1. Elbow Method & Silhouette Scores (k = 2 to 7)
    elbow_data = []
    max_test_k = min(8, len(df) - 1)
    for test_k in range(2, max_test_k):
        km_test = KMeans(n_clusters=test_k, random_state=42, n_init=10)
        km_test.fit(X_scaled)
        sil = float(silhouette_score(X_scaled, km_test.labels_)) if len(df) > test_k else 0.0
        elbow_data.append({
            "k": test_k,
            "inertia": round(float(km_test.inertia_), 2),
            "silhouette_score": round(sil, 4)
        })
    
    # 2. Train Chosen K-Means Model
    kmeans = KMeans(n_clusters=k, random_state=42, n_init=10)
    cluster_labels = kmeans.fit_predict(X_scaled)
    df["cluster"] = cluster_labels
    
    # 3. PCA 2D Dimensionality Reduction for Visualization
    pca = PCA(n_components=2, random_state=42)
    pca_coords = pca.fit_transform(X_scaled)
    df["pca_x"] = [round(float(c[0]), 3) for c in pca_coords]
    df["pca_y"] = [round(float(c[1]), 3) for c in pca_coords]
    
    explained_var = [round(float(v) * 100, 2) for v in pca.explained_variance_ratio_]
    
    # 4. Cluster Profiles and Descriptive Statistics
    cluster_profiles = []
    for c_id in range(k):
        sub = df[df["cluster"] == c_id]
        c_count = len(sub)
        c_pct = round((c_count / len(df)) * 100, 1)
        
        # Determine data-driven label based on characteristics
        avg_age = sub["age"].mean()
        avg_vis = sub["total_visits"].mean()
        avg_adm = sub["total_admissions"].mean()
        avg_bill = sub["total_billed"].mean()
        
        if avg_bill > df["total_billed"].mean() * 1.3 and avg_adm > 1:
            segment_label = "High Utilization / Inpatient Cohort"
        elif avg_vis > df["total_visits"].mean() and avg_adm <= 1:
            segment_label = "Frequent Outpatient Consultations"
        elif avg_age < 40:
            segment_label = "Young Low-Acuity / Routine Cohort"
        else:
            segment_label = "Moderate General Care Cohort"
            
        cluster_profiles.append({
            "cluster_id": c_id,
            "segment_label": segment_label,
            "patient_count": c_count,
            "percentage": c_pct,
            "mean_age": round(float(avg_age), 1),
            "mean_visits": round(float(avg_vis), 1),
            "mean_admissions": round(float(avg_adm), 1),
            "mean_avg_los": round(float(sub["avg_los"].mean()), 1),
            "mean_billed_amount": round(float(avg_bill), 2)
        })
    
    # 5. Scatter samples for frontend plot (capped at 250 for responsive rendering)
    scatter_points = []
    for _, row in df.sample(min(300, len(df)), random_state=42).iterrows():
        scatter_points.append({
            "patient_id": row["patient_id"],
            "cluster": int(row["cluster"]),
            "pca_x": float(row["pca_x"]),
            "pca_y": float(row["pca_y"]),
            "age": int(row["age"]),
            "visits": int(row["total_visits"]),
            "billed": float(row["total_billed"])
        })
        
    overall_silhouette = float(silhouette_score(X_scaled, cluster_labels)) if len(df) > k else 0.0

    return {
        "status": "success",
        "k": k,
        "features_used": feature_cols,
        "total_patients": len(df),
        "overall_silhouette_score": round(overall_silhouette, 4),
        "elbow_curve": elbow_data,
        "cluster_profiles": cluster_profiles,
        "pca_variance_ratio": explained_var,
        "scatter_points": scatter_points,
        "educational_note": "K-Means clusters represent statistical multivariate associations based on hospital utilization and billing patterns. They are not intended as clinical diagnostic categories."
    }
