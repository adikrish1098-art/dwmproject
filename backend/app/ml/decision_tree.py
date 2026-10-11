from typing import Dict, Any, List, Optional
import pandas as pd
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.model_selection import GroupShuffleSplit
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from app.ml.readmission import build_readmission_dataframe

def train_and_evaluate_decision_tree(
    max_depth: int = 4,
    criterion: str = "gini",
    min_samples_split: int = 2,
    min_samples_leaf: int = 1
) -> Dict[str, Any]:
    """
    Trains and inspects an interpretable Decision Tree for 30-day readmission prediction.
    Outputs decision rules, feature importances, confusion matrix, and overfitting analysis.
    """
    df = build_readmission_dataframe()
    if len(df) < 50:
        return {"error": "Insufficient data"}
        
    num_features = ["age", "length_of_stay", "prior_admissions", "prior_visits"]
    cat_features = ["department_id", "admission_type", "diagnosis_category"]
    all_features = num_features + cat_features
    
    X = df[all_features]
    y = df["target_readmission_30d"].values
    groups = df["patient_id"].values
    
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
    
    # Fit preprocessor
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    # Feature names
    cat_encoder = preprocessor.named_transformers_["cat"]
    encoded_cat_names = list(cat_encoder.get_feature_names_out(cat_features))
    feature_names = num_features + encoded_cat_names
    cleaned_feature_names = [
        f.replace("diagnosis_category_", "Diag_")
         .replace("department_id_", "Dept_")
         .replace("admission_type_", "Type_")
        for f in feature_names
    ]
    
    # Train Decision Tree
    dt = DecisionTreeClassifier(
        max_depth=max_depth,
        criterion=criterion,
        min_samples_split=min_samples_split,
        min_samples_leaf=min_samples_leaf,
        class_weight="balanced",
        random_state=42
    )
    dt.fit(X_train_proc, y_train)
    
    # Predictions
    y_train_pred = dt.predict(X_train_proc)
    y_test_pred = dt.predict(X_test_proc)
    y_test_proba = dt.predict_proba(X_test_proc)[:, 1] if hasattr(dt, "predict_proba") else None
    
    # Evaluation Metrics
    train_acc = round(float(accuracy_score(y_train, y_train_pred)), 4)
    test_acc = round(float(accuracy_score(y_test, y_test_pred)), 4)
    train_f1 = round(float(f1_score(y_train, y_train_pred, zero_division=0)), 4)
    test_f1 = round(float(f1_score(y_test, y_test_pred, zero_division=0)), 4)
    
    prec = round(float(precision_score(y_test, y_test_pred, zero_division=0)), 4)
    rec = round(float(recall_score(y_test, y_test_pred, zero_division=0)), 4)
    try:
        auc = round(float(roc_auc_score(y_test, y_test_proba)), 4) if y_test_proba is not None else 0.50
    except Exception:
        auc = 0.50
        
    cm = confusion_matrix(y_test, y_test_pred)
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])
    
    # Tree Text Rules
    tree_rules_text = export_text(dt, feature_names=cleaned_feature_names, max_depth=max_depth)
    
    # Feature Importances
    fi_tuples = sorted(zip(cleaned_feature_names, dt.feature_importances_), key=lambda x: x[1], reverse=True)[:10]
    top_importances = [{"feature": f, "importance": round(float(imp), 4)} for f, imp in fi_tuples if imp > 0.001]
    
    # Overfitting assessment
    overfit_gap_acc = round(train_acc - test_acc, 4)
    overfit_status = "High Variance (Overfitting)" if overfit_gap_acc > 0.15 else "Balanced Generalization"

    return {
        "status": "success",
        "hyperparameters": {
            "max_depth": max_depth,
            "criterion": criterion,
            "min_samples_split": min_samples_split,
            "min_samples_leaf": min_samples_leaf
        },
        "metrics": {
            "test_accuracy": test_acc,
            "test_precision": prec,
            "test_recall": rec,
            "test_f1_score": test_f1,
            "test_roc_auc": auc,
            "confusion_matrix": {"tn": tn, "fp": fp, "fn": fn, "tp": tp}
        },
        "overfitting_analysis": {
            "train_accuracy": train_acc,
            "test_accuracy": test_acc,
            "train_f1": train_f1,
            "test_f1": test_f1,
            "accuracy_gap": overfit_gap_acc,
            "assessment": overfit_status
        },
        "feature_importances": top_importances,
        "tree_rules_text": tree_rules_text,
        "educational_note": "A high feature importance in a decision tree reflects discriminatory split entropy in this dataset, not a clinical causal mechanism."
    }
