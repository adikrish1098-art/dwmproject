import os
import sys

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.etl.pipeline import run_etl_pipeline

if __name__ == "__main__":
    print("Starting Hospital Data Warehouse ETL Pipeline...")
    res = run_etl_pipeline()
    print(f"ETL Execution Finished: {res}")
