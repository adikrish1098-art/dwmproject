#!/bin/bash
set -e

echo "Starting Hospital Data Warehouse & Patient Analysis Platform..."

# Ensure data directory exists
mkdir -p data

# Initialize SQLite databases if not already present
if [ ! -f "data/hospital_operational.db" ] || [ ! -f "data/hospital_warehouse.db" ]; then
    echo "Initializing database schemas and seeding demo accounts..."
    python scripts/initialize_db.py
    echo "Executing initial ETL pipeline..."
    python scripts/run_etl.py
else
    echo "Databases already initialized."
fi

# Determine port (supports dynamic cloud PORT assigned by Render, Railway, etc.)
PORT="${PORT:-8000}"
echo "Launching FastAPI server on port $PORT..."

exec uvicorn backend.main:app --host 0.0.0.0 --port "$PORT"
