from typing import Dict, Any, List, Optional
from sqlalchemy import text
from app.core.database import WarehouseSessionLocal, OperationalSessionLocal

def execute_olap_rollup() -> List[Dict[str, Any]]:
    """
    OLAP Roll-Up:
    Aggregates daily admissions into monthly and yearly totals along the Date hierarchy.
    SQL hierarchy: Day -> Month -> Year
    """
    wh_db = WarehouseSessionLocal()
    try:
        sql = text("""
            SELECT 
                d.year,
                d.month,
                COUNT(f.admission_key) as total_admissions,
                SUM(f.readmission_within_30_days) as total_readmissions,
                ROUND(AVG(f.length_of_stay), 2) as avg_length_of_stay
            FROM fact_admission f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.year, d.month
            ORDER BY d.year ASC, d.month ASC;
        """)
        rows = wh_db.execute(sql).fetchall()
        return [
            {
                "year": int(r[0]),
                "month": int(r[1]),
                "period": f"{r[0]}-{r[1]:02d}",
                "total_admissions": int(r[2]),
                "total_readmissions": int(r[3]),
                "avg_length_of_stay": float(r[4] or 0.0)
            }
            for r in rows
        ]
    finally:
        wh_db.close()

def execute_olap_drilldown(year: int = 2025, quarter: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    OLAP Drill-Down:
    Breaks down higher-level annual aggregates into quarterly or monthly details.
    """
    wh_db = WarehouseSessionLocal()
    try:
        if quarter:
            sql = text("""
                SELECT 
                    d.year,
                    d.quarter,
                    d.month,
                    COUNT(f.visit_key) as visit_count
                FROM fact_patient_visit f
                JOIN dim_date d ON f.date_key = d.date_key
                WHERE d.year = :year AND d.quarter = :quarter
                GROUP BY d.year, d.quarter, d.month
                ORDER BY d.month ASC;
            """)
            rows = wh_db.execute(sql, {"year": year, "quarter": quarter}).fetchall()
        else:
            sql = text("""
                SELECT 
                    d.year,
                    d.quarter,
                    COUNT(f.visit_key) as visit_count
                FROM fact_patient_visit f
                JOIN dim_date d ON f.date_key = d.date_key
                WHERE d.year = :year
                GROUP BY d.year, d.quarter
                ORDER BY d.quarter ASC;
            """)
            rows = wh_db.execute(sql, {"year": year}).fetchall()
            
        return [
            {
                "year": int(r[0]),
                "quarter": f"Q{r[1]}",
                "month": int(r[2]) if quarter else None,
                "visit_count": int(r[3] if quarter else r[2])
            }
            for r in rows
        ]
    finally:
        wh_db.close()

def execute_olap_slice(department_name: Optional[str] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
    """
    OLAP Slice:
    Filters the multidimensional cube along one dimension (e.g. fixed Department or fixed Year).
    """
    wh_db = WarehouseSessionLocal()
    try:
        where_clauses = []
        params = {}
        if department_name:
            where_clauses.append("dep.department_name = :dept")
            params["dept"] = department_name
        if year:
            where_clauses.append("d.year = :year")
            params["year"] = year
            
        where_stmt = ("WHERE " + " AND ".join(where_clauses)) if where_clauses else ""
        
        sql = text(f"""
            SELECT 
                dep.department_name,
                d.year,
                COUNT(f.admission_key) as admission_count,
                ROUND(AVG(f.length_of_stay), 2) as avg_los,
                SUM(f.readmission_within_30_days) as readmission_count
            FROM fact_admission f
            JOIN dim_department dep ON f.department_key = dep.department_key
            JOIN dim_date d ON f.date_key = d.date_key
            {where_stmt}
            GROUP BY dep.department_name, d.year
            ORDER BY dep.department_name ASC, d.year ASC;
        """)
        rows = wh_db.execute(sql, params).fetchall()
        return [
            {
                "department": r[0],
                "year": int(r[1]),
                "admission_count": int(r[2]),
                "avg_los": float(r[3] or 0.0),
                "readmission_count": int(r[4])
            }
            for r in rows
        ]
    finally:
        wh_db.close()

def execute_olap_dice(age_group: str = "65+ (Senior/Geriatric)", department_name: str = "Cardiology") -> List[Dict[str, Any]]:
    """
    OLAP Dice:
    Sub-cube extraction filtered simultaneously across multiple dimensions:
    DimPatient.age_group AND DimDepartment.department_name.
    """
    wh_db = WarehouseSessionLocal()
    try:
        sql = text("""
            SELECT 
                p.age_group,
                dep.department_name,
                diag.diagnosis_category,
                COUNT(f.visit_key) as visit_count
            FROM fact_patient_visit f
            JOIN dim_patient p ON f.patient_key = p.patient_key
            JOIN dim_department dep ON f.department_key = dep.department_key
            JOIN dim_diagnosis diag ON f.diagnosis_key = diag.diagnosis_key
            WHERE p.age_group = :age_grp AND dep.department_name = :dept
            GROUP BY p.age_group, dep.department_name, diag.diagnosis_category
            ORDER BY visit_count DESC;
        """)
        rows = wh_db.execute(sql, {"age_grp": age_group, "dept": department_name}).fetchall()
        return [
            {
                "age_group": r[0],
                "department": r[1],
                "diagnosis_category": r[2],
                "visit_count": int(r[3])
            }
            for r in rows
        ]
    finally:
        wh_db.close()

def execute_olap_pivot() -> List[Dict[str, Any]]:
    """
    OLAP Pivot:
    Rotates dimensions to compare Department vs Month totals in a 2D cross-tabulation.
    """
    wh_db = WarehouseSessionLocal()
    try:
        sql = text("""
            SELECT 
                dep.department_name,
                SUM(CASE WHEN d.month = 1 THEN 1 ELSE 0 END) as Jan,
                SUM(CASE WHEN d.month = 2 THEN 1 ELSE 0 END) as Feb,
                SUM(CASE WHEN d.month = 3 THEN 1 ELSE 0 END) as Mar,
                SUM(CASE WHEN d.month = 4 THEN 1 ELSE 0 END) as Apr,
                SUM(CASE WHEN d.month = 5 THEN 1 ELSE 0 END) as May,
                SUM(CASE WHEN d.month = 6 THEN 1 ELSE 0 END) as Jun,
                SUM(CASE WHEN d.month = 7 THEN 1 ELSE 0 END) as Jul,
                SUM(CASE WHEN d.month = 8 THEN 1 ELSE 0 END) as Aug,
                SUM(CASE WHEN d.month = 9 THEN 1 ELSE 0 END) as Sep,
                SUM(CASE WHEN d.month = 10 THEN 1 ELSE 0 END) as Oct,
                SUM(CASE WHEN d.month = 11 THEN 1 ELSE 0 END) as Nov,
                SUM(CASE WHEN d.month = 12 THEN 1 ELSE 0 END) as Dec,
                COUNT(f.admission_key) as Total
            FROM fact_admission f
            JOIN dim_department dep ON f.department_key = dep.department_key
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY dep.department_name
            ORDER BY Total DESC;
        """)
        rows = wh_db.execute(sql).fetchall()
        return [
            {
                "department": r[0],
                "Jan": int(r[1]), "Feb": int(r[2]), "Mar": int(r[3]), "Apr": int(r[4]),
                "May": int(r[5]), "Jun": int(r[6]), "Jul": int(r[7]), "Aug": int(r[8]),
                "Sep": int(r[9]), "Oct": int(r[10]), "Nov": int(r[11]), "Dec": int(r[12]),
                "Total": int(r[13])
            }
            for r in rows
        ]
    finally:
        wh_db.close()

# ----------------------------------------------------
# 10 SPECIFIC SQL ANALYTICAL REPORTS REQUIRED (SEC 14)
# ----------------------------------------------------

def get_sql_reports_pack() -> Dict[str, Any]:
    wh_db = WarehouseSessionLocal()
    op_db = OperationalSessionLocal()
    try:
        # 1. Monthly patient visits
        sql1 = text("""
            SELECT d.year, d.month, COUNT(f.visit_key) as visits
            FROM fact_patient_visit f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.year, d.month
            ORDER BY d.year ASC, d.month ASC;
        """)
        r1 = [{"period": f"{r[0]}-{r[1]:02d}", "visits": int(r[2])} for r in wh_db.execute(sql1).fetchall()]

        # 2. Department-wise admissions
        sql2 = text("""
            SELECT dep.department_name, COUNT(f.admission_key) as admissions
            FROM fact_admission f
            JOIN dim_department dep ON f.department_key = dep.department_key
            GROUP BY dep.department_name
            ORDER BY admissions DESC;
        """)
        r2 = [{"department": r[0], "admissions": int(r[1])} for r in wh_db.execute(sql2).fetchall()]

        # 3. Average length of stay by department
        sql3 = text("""
            SELECT dep.department_name, ROUND(AVG(f.length_of_stay), 2) as avg_los
            FROM fact_admission f
            JOIN dim_department dep ON f.department_key = dep.department_key
            GROUP BY dep.department_name
            ORDER BY avg_los DESC;
        """)
        r3 = [{"department": r[0], "avg_los": float(r[1] or 0.0)} for r in wh_db.execute(sql3).fetchall()]

        # 4. Monthly billed amounts
        sql4 = text("""
            SELECT d.year, d.month, ROUND(SUM(f.amount_billed), 2) as total_billed
            FROM fact_billing f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.year, d.month
            ORDER BY d.year ASC, d.month ASC;
        """)
        r4 = [{"period": f"{r[0]}-{r[1]:02d}", "total_billed": float(r[2] or 0.0)} for r in wh_db.execute(sql4).fetchall()]

        # 5. Actual collections and outstanding balances
        sql5 = text("""
            SELECT 
                ROUND(SUM(amount_billed), 2) as total_billed,
                ROUND(SUM(amount_paid), 2) as total_collected,
                ROUND(SUM(outstanding_amount), 2) as total_outstanding,
                ROUND((SUM(amount_paid) / SUM(amount_billed)) * 100, 1) as collection_rate
            FROM fact_billing;
        """)
        r5_row = wh_db.execute(sql5).fetchone()
        r5 = {
            "total_billed": float(r5_row[0] or 0.0),
            "total_collected": float(r5_row[1] or 0.0),
            "total_outstanding": float(r5_row[2] or 0.0),
            "collection_rate_percent": float(r5_row[3] or 0.0)
        }

        # 6. Most common diagnosis categories
        sql6 = text("""
            SELECT diag.diagnosis_category, COUNT(f.visit_key) as encounter_count
            FROM fact_patient_visit f
            JOIN dim_diagnosis diag ON f.diagnosis_key = diag.diagnosis_key
            GROUP BY diag.diagnosis_category
            ORDER BY encounter_count DESC
            LIMIT 10;
        """)
        r6 = [{"category": r[0], "count": int(r[1])} for r in wh_db.execute(sql6).fetchall()]

        # 7. Doctor-wise appointment counts
        sql7 = text("""
            SELECT doc.doctor_name, doc.specialty, COUNT(f.visit_key) as patient_encounters
            FROM fact_patient_visit f
            JOIN dim_doctor doc ON f.doctor_key = doc.doctor_key
            GROUP BY doc.doctor_name, doc.specialty
            ORDER BY patient_encounters DESC
            LIMIT 10;
        """)
        r7 = [{"doctor": r[0], "specialty": r[1], "encounters": int(r[2])} for r in wh_db.execute(sql7).fetchall()]

        # 8. Readmission rates
        sql8 = text("""
            SELECT 
                COUNT(*) as total_admissions,
                SUM(readmission_within_30_days) as readmission_count,
                ROUND((CAST(SUM(readmission_within_30_days) AS FLOAT) / COUNT(*)) * 100, 2) as readmission_rate_pct
            FROM fact_admission;
        """)
        r8_row = wh_db.execute(sql8).fetchone()
        r8 = {
            "total_admissions": int(r8_row[0] or 0),
            "readmissions": int(r8_row[1] or 0),
            "rate_percent": float(r8_row[2] or 0.0)
        }

        # 9. Patient visit frequency distribution
        sql9 = text("""
            SELECT visits_bucket, COUNT(*) as patient_count
            FROM (
                SELECT 
                    patient_key,
                    CASE 
                        WHEN COUNT(*) = 1 THEN '1 Visit (Occasional)'
                        WHEN COUNT(*) BETWEEN 2 AND 3 THEN '2-3 Visits (Moderate)'
                        ELSE '4+ Visits (Frequent)'
                    END as visits_bucket
                FROM fact_patient_visit
                GROUP BY patient_key
            )
            GROUP BY visits_bucket
            ORDER BY patient_count DESC;
        """)
        r9 = [{"bucket": r[0], "patients": int(r[1])} for r in wh_db.execute(sql9).fetchall()]

        # 10. Department workload trends
        sql10 = text("""
            SELECT 
                dep.department_name,
                COUNT(f.visit_key) as total_visits,
                ROUND(AVG(f.visit_count), 2) as avg_visits_per_encounter
            FROM fact_patient_visit f
            JOIN dim_department dep ON f.department_key = dep.department_key
            GROUP BY dep.department_name
            ORDER BY total_visits DESC;
        """)
        r10 = [{"department": r[0], "total_visits": int(r[1])} for r in wh_db.execute(sql10).fetchall()]

        return {
            "monthly_visits": r1,
            "department_admissions": r2,
            "avg_los_by_department": r3,
            "monthly_billed": r4,
            "billing_collections": r5,
            "top_diagnoses": r6,
            "doctor_workload": r7,
            "readmission_summary": r8,
            "visit_frequency": r9,
            "department_workload": r10
        }
    finally:
        wh_db.close()
        op_db.close()
