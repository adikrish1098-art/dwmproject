from typing import Optional, List
from pydantic import BaseModel, Field

class ClusterRequest(BaseModel):
    k: int = Field(3, ge=2, le=8, description="Number of clusters")
    features: Optional[List[str]] = None

class AprioriRequest(BaseModel):
    min_support: float = Field(0.03, ge=0.005, le=0.5)
    min_confidence: float = Field(0.20, ge=0.05, le=1.0)
    min_lift: float = Field(1.0, ge=0.5, le=10.0)

class DecisionTreeRequest(BaseModel):
    max_depth: int = Field(4, ge=2, le=10)
    criterion: str = Field("gini", pattern="^(gini|entropy)$")
    min_samples_split: int = Field(2, ge=2, le=20)
    min_samples_leaf: int = Field(1, ge=1, le=10)

class SinglePredictionRequest(BaseModel):
    age: int = Field(65, ge=18, le=100)
    sex: str = Field("Male")
    department_id: str = Field("DEP-CAR")
    admission_type: str = Field("Emergency")
    diagnosis_category: str = Field("Heart Failure")
    length_of_stay: int = Field(5, ge=1, le=30)
    prior_admissions: int = Field(1, ge=0, le=10)
    prior_visits: int = Field(2, ge=0, le=20)
