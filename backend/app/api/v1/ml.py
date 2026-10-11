from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_operational_db
from app.models.operational import User
from app.schemas.analytics import DecisionTreeRequest, SinglePredictionRequest
from app.ml.readmission import train_and_evaluate_readmission_models, predict_single_patient
from app.ml.decision_tree import train_and_evaluate_decision_tree
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/ml", tags=["Machine Learning (30-Day Readmission & Decision Tree)"])

ml_users = require_roles(["Administrator", "Data Analyst", "Doctor"])
ml_trainers = require_roles(["Administrator", "Data Analyst"])

@router.post("/readmission/train")
def train_readmission_models(
    current_user: User = Depends(ml_trainers),
    db: Session = Depends(get_operational_db)
):
    """Trains Dummy Baseline, Logistic Regression, and Random Forest on 30-day readmissions."""
    result = train_and_evaluate_readmission_models()
    log_audit_event(db, current_user, "ML_TRAIN_READMISSION", "ml", "Trained 30-day readmission classification models")
    return result

@router.post("/readmission/predict")
def live_predict_patient_readmission(
    req: SinglePredictionRequest,
    current_user: User = Depends(ml_users)
):
    """Simulates live 30-day readmission risk inference for demonstration."""
    sample_dict = req.model_dump()
    return predict_single_patient(sample_dict)

@router.post("/decision-tree/train")
def train_decision_tree(
    req: DecisionTreeRequest,
    current_user: User = Depends(ml_trainers),
    db: Session = Depends(get_operational_db)
):
    """Trains an interpretable Decision Tree classifier with hyperparameters and overfitting check."""
    result = train_and_evaluate_decision_tree(
        max_depth=req.max_depth,
        criterion=req.criterion,
        min_samples_split=req.min_samples_split,
        min_samples_leaf=req.min_samples_leaf
    )
    log_audit_event(db, current_user, "ML_TRAIN_DECISION_TREE", "ml", f"Trained Decision Tree (depth={req.max_depth}, crit={req.criterion})")
    return result

@router.get("/comparison")
def compare_all_models(current_user: User = Depends(ml_users)):
    """Consolidated side-by-side model comparison table and performance metrics."""
    readmission_res = train_and_evaluate_readmission_models()
    tree_res = train_and_evaluate_decision_tree(max_depth=4)
    
    models_table = []
    
    # Add readmission models
    for k, v in readmission_res.get("model_results", {}).items():
        models_table.append({
            "model_key": k,
            "name": v["model_name"],
            "accuracy": v["accuracy"],
            "precision": v["precision"],
            "recall": v["recall"],
            "f1_score": v["f1_score"],
            "roc_auc": v["roc_auc"],
            "confusion_matrix": v["confusion_matrix"],
            "type": "Ensemble / Linear"
        })
        
    # Add decision tree
    tree_metrics = tree_res.get("metrics", {})
    models_table.append({
        "model_key": "decision_tree",
        "name": "Decision Tree Classifier",
        "accuracy": tree_metrics.get("test_accuracy", 0.0),
        "precision": tree_metrics.get("test_precision", 0.0),
        "recall": tree_metrics.get("test_recall", 0.0),
        "f1_score": tree_metrics.get("test_f1_score", 0.0),
        "roc_auc": tree_metrics.get("test_roc_auc", 0.0),
        "confusion_matrix": tree_metrics.get("confusion_matrix", {}),
        "type": "Tree-based Interpretable"
    })
    
    return {
        "status": "success",
        "comparison_table": models_table,
        "roc_curves": readmission_res.get("roc_curves", {}),
        "feature_importances": readmission_res.get("feature_importances", []),
        "overfitting_analysis": tree_res.get("overfitting_analysis", {}),
        "educational_guidance": "In hospital readmission prediction, optimizing for Recall is typically prioritized over Accuracy alone, as minimizing false negatives (failing to identify a vulnerable patient at discharge) is the primary clinical goal. Trade-offs between Precision and Recall should guide threshold selection."
    }
