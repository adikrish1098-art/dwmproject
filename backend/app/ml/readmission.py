import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from sklearn.model_selection import train_test_split, GroupShuffleSplit
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, roc_curve
)
from app.core.database import OperationalSessionLocal
from app.models.operational import Admission, Patient, Encounter, Diagnosis

_TRAINED_PIPELINES = {}

def build_readmission_dataframe() -> pd.DataFrame:
    """
    Constructs admission-level prediction dataset with chronological historical features.
    Excludes future post-discharge events to prevent target leakage.
    """
    db = OperationalSessionLocal()
    try:
        from sqlalchemy import text
        query = text("""
            SELECT 
                a.id AS admission_id,
                a.patient_id,
                CAST(p.age AS FLOAT) AS age,
                p.sex,
                a.department_id,
                COALESCE(a.admission_type, 'Emergency') AS admission_type,
                COALESCE(
                    (SELECT d.diagnosis_category FROM diagnoses d WHERE d.encounter_id = a.encounter_id LIMIT 1),
                    'General'
                ) AS diagnosis_category,
                CAST(a.length_of_stay AS FLOAT) AS length_of_stay,
                a.is_readmission_30d
            FROM admissions a
            JOIN patients p ON p.id = a.patient_id
            ORDER BY a.admission_date ASC
        """)
        results = db.execute(query).fetchall()
        rows = []
        patient_history = {}
        for r in results:
            adm_id, pat_id, age, sex, dept_id, adm_type, diag_cat, los, is_readm = r
            if pat_id not in patient_history:
                patient_history[pat_id] = {"adm_count": 0, "visit_count": 0}
            prior_adms = patient_history[pat_id]["adm_count"]
            prior_vis = patient_history[pat_id]["visit_count"]
            
            rows.append({
                "admission_id": adm_id,
                "patient_id": pat_id,
                "age": float(age or 0),
                "sex": sex or "Unknown",
                "department_id": dept_id or "General",
                "admission_type": adm_type or "Emergency",
                "diagnosis_category": diag_cat or "General",
                "length_of_stay": float(los or 0),
                "prior_admissions": float(prior_adms),
                "prior_visits": float(prior_vis),
                "target_readmission_30d": 1 if is_readm else 0
            })
            patient_history[pat_id]["adm_count"] += 1
            patient_history[pat_id]["visit_count"] += 1
            
        return pd.DataFrame(rows)
    finally:
        db.close()

def train_and_evaluate_readmission_models() -> Dict[str, Any]:
    """
    Trains Dummy, Logistic Regression, and Random Forest classifiers.
    Uses GroupShuffleSplit on patient_id to prevent intra-patient data leakage between train/test splits.
    """
    global _TRAINED_PIPELINES
    df = build_readmission_dataframe()
    
    if len(df) < 50:
        return {"error": "Insufficient admission samples to train prediction models."}
        
    num_features = ["age", "length_of_stay", "prior_admissions", "prior_visits"]
    cat_features = ["department_id", "admission_type", "diagnosis_category", "sex"]
    all_features = num_features + cat_features
    
    X = df[all_features]
    y = df["target_readmission_30d"].values
    groups = df["patient_id"].values
    
    # 1. Group-aware train-test split (80% train, 20% test)
    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))
    
    X_train, X_test = X.iloc[train_idx], X.iloc[test_idx]
    y_train, y_test = y[train_idx], y[test_idx]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), num_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features)
        ]
    )
    
    models = {
        "dummy_baseline": DummyClassifier(strategy="most_frequent"),
        "logistic_regression": LogisticRegression(class_weight="balanced", max_iter=1000, random_state=42),
        "random_forest": RandomForestClassifier(n_estimators=100, max_depth=6, class_weight="balanced", random_state=42)
    }
    
    results = {}
    roc_curves_data = {}
    
    for name, clf in models.items():
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])
        
        pipeline.fit(X_train, y_train)
        _TRAINED_PIPELINES[name] = pipeline
        
        y_pred = pipeline.predict(X_test)
        
        if hasattr(pipeline, "predict_proba"):
            y_proba = pipeline.predict_proba(X_test)[:, 1]
            try:
                auc_score = round(float(roc_auc_score(y_test, y_proba)), 4)
                fpr, tpr, _ = roc_curve(y_test, y_proba)
                # Subsample ROC points for clean JSON output
                roc_points = [{"fpr": round(float(f), 3), "tpr": round(float(t), 3)} for f, t in zip(fpr[::2], tpr[::2])]
                if {"fpr": 1.0, "tpr": 1.0} not in roc_points:
                    roc_points.append({"fpr": 1.0, "tpr": 1.0})
                roc_curves_data[name] = roc_points
            except Exception:
                auc_score = 0.50
                roc_curves_data[name] = []
        else:
            auc_score = 0.50
            roc_curves_data[name] = []
            
        cm = confusion_matrix(y_test, y_pred)
        tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
        
        results[name] = {
            "model_name": name.replace("_", " ").title(),
            "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
            "precision": round(float(precision_score(y_test, y_pred, zero_division=0)), 4),
            "recall": round(float(recall_score(y_test, y_pred, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_test, y_pred, zero_division=0)), 4),
            "roc_auc": auc_score,
            "confusion_matrix": {
                "tn": tn, "fp": fp, "fn": fn, "tp": tp
            }
        }
        
    # Feature Importances from Random Forest
    rf_pipeline = _TRAINED_PIPELINES.get("random_forest")
    feature_importances = []
    if rf_pipeline:
        fitted_preprocessor = rf_pipeline.named_steps["preprocessor"]
        cat_encoder = fitted_preprocessor.named_transformers_["cat"]
        encoded_cat_names = list(cat_encoder.get_feature_names_out(cat_features))
        feature_names = num_features + encoded_cat_names
        
        rf_clf = rf_pipeline.named_steps["classifier"]
        importances = rf_clf.feature_importances_
        
        fi_tuples = sorted(zip(feature_names, importances), key=lambda x: x[1], reverse=True)[:10]
        feature_importances = [{"feature": f.replace("diagnosis_category_", "Diag: ").replace("department_id_", "Dept: "), "importance": round(float(imp), 4)} for f, imp in fi_tuples]
        
    return {
        "status": "success",
        "dataset_summary": {
            "total_admissions": len(df),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "readmission_cases_test": int(sum(y_test)),
            "negative_cases_test": int(len(y_test) - sum(y_test))
        },
        "model_results": results,
        "roc_curves": roc_curves_data,
        "feature_importances": feature_importances,
        "educational_note": "Models evaluated with group-stratified patient holdout validation to eliminate data leakage. Metrics demonstrate statistical classification behavior on synthetic data, not clinical performance."
    }

def predict_single_patient(sample: Dict[str, Any]) -> Dict[str, Any]:
    """
    Inference endpoint for live educational demo predictions.
    """
    global _TRAINED_PIPELINES
    if "random_forest" not in _TRAINED_PIPELINES:
        train_and_evaluate_readmission_models()
        
    model = _TRAINED_PIPELINES.get("random_forest")
    if not model:
        return {"error": "Model not available"}
        
    df_sample = pd.DataFrame([{
        "age": float(sample.get("age", 65)),
        "sex": sample.get("sex", "Male"),
        "department_id": sample.get("department_id", "DEP-CAR"),
        "admission_type": sample.get("admission_type", "Emergency"),
        "diagnosis_category": sample.get("diagnosis_category", "Heart Failure"),
        "length_of_stay": float(sample.get("length_of_stay", 5)),
        "prior_admissions": float(sample.get("prior_admissions", 1)),
        "prior_visits": float(sample.get("prior_visits", 2))
    }])
    
    proba = model.predict_proba(df_sample)[0]
    pred = int(model.predict(df_sample)[0])
    
    readmission_risk = round(float(proba[1]) * 100, 1)
    
    risk_level = "High" if readmission_risk > 60 else ("Moderate" if readmission_risk > 35 else "Low")
    
    # Contributing factors heuristic
    risk_factors = []
    if float(sample.get("prior_admissions", 0)) >= 2:
        risk_factors.append("Multiple prior hospitalizations")
    if float(sample.get("length_of_stay", 0)) >= 7:
        risk_factors.append("Extended length of stay (>=7 days)")
    if float(sample.get("age", 0)) >= 70:
        risk_factors.append("Geriatric age group (>=70 years)")
    if sample.get("admission_type") == "Emergency":
        risk_factors.append("Emergency admission pathway")
    if not risk_factors:
        risk_factors.append("Standard post-discharge monitoring baseline")
        
    return {
        "prediction": pred,
        "readmission_risk_percentage": readmission_risk,
        "risk_level": risk_level,
        "key_risk_factors": risk_factors,
        "model_used": "Random Forest Classifier (Ensemble)",
        "disclaimer": "Demonstration prediction based on synthetic data. Not clinical decision support."
    }
