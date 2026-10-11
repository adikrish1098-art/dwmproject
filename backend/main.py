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

@app.get(f"{settings.API_V1_STR}/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION
    }

# Production Static File & SPA Fallback Serving
frontend_dist = os.path.join(settings.BASE_DIR, "frontend", "dist")
if not os.path.exists(frontend_dist):
    # Also check relative to backend directory for Docker containers
    alt_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
    if os.path.exists(alt_dist):
        frontend_dist = alt_dist

if os.path.exists(frontend_dist):
    from fastapi.staticfiles import StaticFiles
    from fastapi.responses import FileResponse
    from fastapi import HTTPException
    
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Do not catch API endpoints or documentation
        if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "project": settings.PROJECT_NAME,
            "version": settings.PROJECT_VERSION,
            "documentation": "/docs",
            "health": f"{settings.API_V1_STR}/health",
            "mode": "development (run frontend with npm run dev on port 5173)"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
