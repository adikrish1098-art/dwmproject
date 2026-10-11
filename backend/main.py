import os
import sys

# Ensure backend root is on sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.patients import router as patients_router
from app.api.v1.doctors import router as doctors_router
from app.api.v1.departments import router as departments_router
from app.api.v1.appointments import router as appointments_router
from app.api.v1.admissions import router as admissions_router
from app.api.v1.billing import router as billing_router
from app.api.v1.warehouse import router as warehouse_router
from app.api.v1.mining import router as mining_router
from app.api.v1.ml import router as ml_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.audit import router as audit_router
from app.api.v1.reports import router as reports_router
from app.api.v1.datasets import router as datasets_router
from app.api.v1.diagnoses import router as diagnoses_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.PROJECT_VERSION,
    description="Integrated Hospital Data Warehouse, OLAP Analytics, K-Means Clustering, Apriori Association Rules, and 30-Day Readmission Prediction Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
v1_str = settings.API_V1_STR
app.include_router(auth_router, prefix=v1_str)
app.include_router(users_router, prefix=v1_str)
app.include_router(patients_router, prefix=v1_str)
app.include_router(doctors_router, prefix=v1_str)
app.include_router(departments_router, prefix=v1_str)
app.include_router(appointments_router, prefix=v1_str)
app.include_router(admissions_router, prefix=v1_str)
app.include_router(billing_router, prefix=v1_str)
app.include_router(diagnoses_router, prefix=v1_str)
app.include_router(warehouse_router, prefix=v1_str)
app.include_router(mining_router, prefix=v1_str)
app.include_router(ml_router, prefix=v1_str)
app.include_router(dashboard_router, prefix=v1_str)
app.include_router(audit_router, prefix=v1_str)
app.include_router(reports_router, prefix=v1_str)
app.include_router(datasets_router, prefix=v1_str)

@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health"
    }

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
