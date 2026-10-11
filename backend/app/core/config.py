import os
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Hospital Data Warehouse & Clinical Mining Platform"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-key-dwm-mini-project-change-in-production-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Databases
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    OPERATIONAL_DB_PATH: str = os.path.join(BASE_DIR, "data", "hospital_operational.db")
    WAREHOUSE_DB_PATH: str = os.path.join(BASE_DIR, "data", "hospital_warehouse.db")
    
    OPERATIONAL_DATABASE_URL: str = os.getenv(
        "OPERATIONAL_DATABASE_URL", 
        f"sqlite:///{OPERATIONAL_DB_PATH}"
    )
    WAREHOUSE_DATABASE_URL: str = os.getenv(
        "WAREHOUSE_DATABASE_URL", 
        f"sqlite:///{WAREHOUSE_DB_PATH}"
    )
    
    # Rate Limiting & Auth
    MAX_LOGIN_ATTEMPTS: int = 5
    LOGIN_COOLDOWN_SECONDS: int = 300
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]
    
    # Synthetic Data Storage
    SYNTHETIC_DATA_DIR: str = os.path.join(BASE_DIR, "data", "synthetic")
    
    model_config = SettingsConfigDict(case_sensitive=True, env_file=".env", extra="ignore")

settings = Settings()
