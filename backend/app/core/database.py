import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from app.core.config import settings

# Ensure data directory exists
os.makedirs(os.path.dirname(settings.OPERATIONAL_DB_PATH), exist_ok=True)
os.makedirs(os.path.dirname(settings.WAREHOUSE_DB_PATH), exist_ok=True)
os.makedirs(settings.SYNTHETIC_DATA_DIR, exist_ok=True)

# 1. Operational Database Engine (OLTP)
operational_engine = create_engine(
    settings.OPERATIONAL_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.OPERATIONAL_DATABASE_URL else {},
    echo=False
)

# 2. Analytical Warehouse Engine (OLAP / Star Schema)
warehouse_engine = create_engine(
    settings.WAREHOUSE_DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.WAREHOUSE_DATABASE_URL else {},
    echo=False
)

# Enable SQLite foreign key constraint enforcement
@event.listens_for(operational_engine, "connect")
def set_sqlite_pragma_operational(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

@event.listens_for(warehouse_engine, "connect")
def set_sqlite_pragma_warehouse(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

OperationalSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=operational_engine)
WarehouseSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=warehouse_engine)

BaseOperational = declarative_base()
BaseWarehouse = declarative_base()

def get_operational_db():
    """Dependency for operational OLTP database session."""
    db: Session = OperationalSessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_warehouse_db():
    """Dependency for analytical warehouse OLAP database session."""
    db: Session = WarehouseSessionLocal()
    try:
        yield db
    finally:
        db.close()
