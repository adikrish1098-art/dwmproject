from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_operational_db
from app.models.operational import User
from app.schemas.analytics import ClusterRequest, AprioriRequest
from app.mining.clustering import run_kmeans_clustering
from app.mining.apriori import run_apriori_mining
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/mining", tags=["Data Mining (Clustering & Association)"])

analyst_access = require_roles(["Administrator", "Data Analyst"])

@router.post("/clustering/run")
def trigger_kmeans_clustering(
    req: ClusterRequest,
    current_user: User = Depends(analyst_access),
    db: Session = Depends(get_operational_db)
):
    """Executes K-Means Clustering on patient multidimensional feature vectors."""
    result = run_kmeans_clustering(k=req.k, feature_cols=req.features)
    log_audit_event(db, current_user, "KMEANS_CLUSTERING_RUN", "mining", f"K-Means executed with k={req.k}")
    return result

@router.post("/apriori/run")
def trigger_apriori_mining(
    req: AprioriRequest,
    current_user: User = Depends(analyst_access),
    db: Session = Depends(get_operational_db)
):
    """Executes Apriori Association Rule Mining on encounter diagnoses and procedures."""
    result = run_apriori_mining(
        min_support=req.min_support,
        min_confidence=req.min_confidence,
        min_lift=req.min_lift
    )
    log_audit_event(db, current_user, "APRIORI_MINING_RUN", "mining", f"Apriori run: sup={req.min_support}, conf={req.min_confidence}")
    return result
