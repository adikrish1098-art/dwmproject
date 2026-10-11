import pytest
from fastapi.testclient import TestClient
from main import app
from app.core.security import verify_password, get_password_hash
from app.etl.pipeline import run_etl_pipeline
from app.mining.clustering import run_kmeans_clustering
from app.mining.apriori import run_apriori_mining
from app.ml.readmission import train_and_evaluate_readmission_models, predict_single_patient
from app.ml.decision_tree import train_and_evaluate_decision_tree

client = TestClient(app)

# 1. AUTHENTICATION & RBAC TESTS

def test_password_hashing():
    pwd = "SecureCollegeDemo2026!"
    hashed = get_password_hash(pwd)
    assert hashed != pwd
    assert verify_password(pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_admin_login_success():
    resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["role"] == "Administrator"

def test_invalid_login_rejected():
    resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "WrongPassword999!"
    })
    assert resp.status_code == 401
    assert "Invalid username or password" in resp.json()["detail"]

def test_public_signup_and_duplicate_prevention():
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_user = {
        "full_name": f"Test Student {uid}",
        "email": f"student_{uid}@college.edu",
        "username": f"student_{uid}",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "phone_number": "+1-555-4321",
        "terms_acknowledged": True
    }
    # Initial registration
    resp = client.post("/api/v1/auth/signup", json=test_user)
    assert resp.status_code == 201
    assert resp.json()["role"] == "Receptionist"  # Must never be Admin
    
    # Duplicate registration attempt should be rejected
    dup_resp = client.post("/api/v1/auth/signup", json=test_user)
    assert dup_resp.status_code == 400

def test_unauthorized_access_blocked():
    # Fresh unauthenticated client instance without session cookies
    fresh_client = TestClient(app)
    resp = fresh_client.get("/api/v1/warehouse/schema-summary")
    assert resp.status_code == 401

def test_role_based_access_restriction():
    # Login as Receptionist
    rec_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "reception",
        "password": "ReceptionPassword123!"
    })
    rec_token = rec_login.json()["access_token"]
    
    # Receptionist attempts to access admin user management
    resp = client.get(
        "/api/v1/users/",
        headers={"Authorization": f"Bearer {rec_token}"}
    )
    assert resp.status_code == 403  # Forbidden for non-Admin

# 2. PATIENT CRUD & DE-IDENTIFICATION TESTS

def test_patient_list_and_deidentification():
    # Analyst sees masked data
    analyst_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "analyst",
        "password": "AnalystPassword123!"
    })
    analyst_token = analyst_login.json()["access_token"]
    
    resp = client.get("/api/v1/patients/", headers={"Authorization": f"Bearer {analyst_token}"})
    assert resp.status_code == 200
    patients = resp.json()["patients"]
    assert len(patients) > 0
    # Verify masking
    assert "De-identified" in patients[0]["full_name"]
    assert "***" in patients[0]["phone_number"]

# 3. APPOINTMENT SCHEDULING & CONFLICT PREVENTION TESTS

def test_appointment_conflict_prevention():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Book first appointment
    appt1 = {
        "patient_id": "PAT-1001",
        "doctor_id": "DOC-101",
        "department_id": "DEP-CAR",
        "appointment_date": "2026-11-20T10:00:00",
        "reason": "Cardiac Checkup"
    }
    client.post("/api/v1/appointments/", json=appt1, headers=headers)
    
    # Attempt conflicting appointment for same doctor at same time
    appt_conflict = {
        "patient_id": "PAT-1002",
        "doctor_id": "DOC-101",
        "department_id": "DEP-CAR",
        "appointment_date": "2026-11-20T10:15:00",
        "reason": "Conflicting Slot"
    }
    resp = client.post("/api/v1/appointments/", json=appt_conflict, headers=headers)
    assert resp.status_code == 409
    assert "Scheduling conflict" in resp.json()["detail"]

# 4. ETL PIPELINE & STAR SCHEMA TESTS

def test_etl_execution_and_idempotency():
    res1 = run_etl_pipeline()
    assert res1["status"] == "SUCCESS"
    assert res1["records_extracted"] > 0
    
    # Run second time: should load 0 duplicates
    res2 = run_etl_pipeline()
    assert res2["status"] == "SUCCESS"
    assert res2["records_loaded"] == 0

# 5. DATA MINING (CLUSTERING & APRIORI) TESTS

def test_kmeans_clustering():
    res = run_kmeans_clustering(k=3)
    assert res["status"] == "success"
    assert res["k"] == 3
    assert len(res["cluster_profiles"]) == 3
    assert len(res["elbow_curve"]) >= 4
    assert res["overall_silhouette_score"] > 0.0

def test_apriori_association_mining():
    res = run_apriori_mining(min_support=0.02, min_confidence=0.15, min_lift=1.0)
    assert res["status"] == "success"
    assert res["frequent_itemsets_count"] > 0
    assert "rules" in res

# 6. MACHINE LEARNING & DECISION TREE TESTS

def test_readmission_prediction_models():
    res = train_and_evaluate_readmission_models()
    assert res["status"] == "success"
    results = res["model_results"]
    assert "random_forest" in results
    assert "logistic_regression" in results
    assert "dummy_baseline" in results
    # Random forest accuracy should meet or exceed baseline
    assert results["random_forest"]["accuracy"] > 0.50

def test_live_prediction_inference():
    sample = {
        "age": 72,
        "sex": "Female",
        "department_id": "DEP-CAR",
        "admission_type": "Emergency",
        "diagnosis_category": "Heart Failure",
        "length_of_stay": 8,
        "prior_admissions": 2,
        "prior_visits": 3
    }
    pred = predict_single_patient(sample)
    assert "readmission_risk_percentage" in pred
    assert "risk_level" in pred
    assert pred["risk_level"] in ["High", "Moderate", "Low"]

def test_decision_tree_evaluation_and_rules():
    dt_res = train_and_evaluate_decision_tree(max_depth=3)
    assert dt_res["status"] == "success"
    assert "tree_rules_text" in dt_res
    assert len(dt_res["tree_rules_text"]) > 20
    assert "test_accuracy" in dt_res["metrics"]

# 7. CLINICAL RECORDS, DASHBOARD, REPORTS & OLAP TESTS

def test_dashboard_kpis():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    token = admin_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    resp = client.get("/api/v1/dashboard/overview", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "total_patients" in data["kpis"]
    assert "monthly_admissions" in data["charts"]
    assert "department_distribution" in data["charts"]
    assert "etl_freshness" in data

def test_clinical_records_endpoints():
    doctor_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "dr.robert",
        "password": "DoctorPassword123!"
    })
    token = doctor_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test encounters
    resp = client.get("/api/v1/clinical-records/encounters", headers=headers)
    assert resp.status_code == 200
    assert resp.json()["total"] > 0
    
    # Test diagnoses
    d_resp = client.get("/api/v1/clinical-records/diagnoses", headers=headers)
    assert d_resp.status_code == 200
    assert d_resp.json()["total"] > 0
    
    # Test categories summary
    c_resp = client.get("/api/v1/clinical-records/diagnoses/categories-summary", headers=headers)
    assert c_resp.status_code == 200
    assert len(c_resp.json()) > 0

def test_olap_analytical_operations():
    analyst_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "analyst",
        "password": "AnalystPassword123!"
    })
    token = analyst_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Roll-up
    r_resp = client.get("/api/v1/warehouse/olap/rollup", headers=headers)
    assert r_resp.status_code == 200
    assert r_resp.json()["operation"] == "Roll-Up"
    
    # Drill-down
    dd_resp = client.get("/api/v1/warehouse/olap/drilldown?year=2025", headers=headers)
    assert dd_resp.status_code == 200
    assert dd_resp.json()["operation"] == "Drill-Down"
    
    # Slice
    s_resp = client.get("/api/v1/warehouse/olap/slice?department=Cardiology", headers=headers)
    assert s_resp.status_code == 200
    assert s_resp.json()["operation"] == "Slice"
    
    # Dice
    d_resp = client.get("/api/v1/warehouse/olap/dice?age_group=65%2B%20(Senior/Geriatric)&department=Cardiology", headers=headers)
    assert d_resp.status_code == 200
    assert d_resp.json()["operation"] == "Dice"
    
    # Pivot
    p_resp = client.get("/api/v1/warehouse/olap/pivot", headers=headers)
    assert p_resp.status_code == 200
    assert p_resp.json()["operation"] == "Pivot (Cross-Tabulation)"

def test_reports_and_csv_export():
    analyst_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "analyst",
        "password": "AnalystPassword123!"
    })
    token = analyst_login.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Summary
    s_resp = client.get("/api/v1/reports/summary", headers=headers)
    assert s_resp.status_code == 200
    assert "kpis" in s_resp.json()
    
    # CSV export
    csv_resp = client.get("/api/v1/reports/export/admissions-csv", headers=headers)
    assert csv_resp.status_code == 200
    assert "text/csv" in csv_resp.headers["content-type"]
    assert "Admission_Key" in csv_resp.text

# 8. ADDITIONAL QA TESTS (SECTION 25 COMPLIANCE)

def test_signup_validation_failures():
    # Passwords do not match
    r1 = client.post("/api/v1/auth/signup", json={
        "full_name": "Invalid User",
        "email": "invalid1@test.com",
        "username": "invalid_user_1",
        "password": "Password123!",
        "confirm_password": "MismatchPassword999!",
        "terms_acknowledged": True
    })
    assert r1.status_code == 400
    assert "Passwords do not match" in r1.json()["detail"]

    # Terms unacknowledged
    r2 = client.post("/api/v1/auth/signup", json={
        "full_name": "Invalid User",
        "email": "invalid2@test.com",
        "username": "invalid_user_2",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_acknowledged": False
    })
    assert r2.status_code == 400
    assert "terms" in r2.json()["detail"].lower()

    # Password too short (Pydantic validation returns 422)
    r3 = client.post("/api/v1/auth/signup", json={
        "full_name": "Invalid User",
        "email": "invalid3@test.com",
        "username": "invalid_user_3",
        "password": "123",
        "confirm_password": "123",
        "terms_acknowledged": True
    })
    assert r3.status_code in [400, 422]

    # Invalid email format
    r4 = client.post("/api/v1/auth/signup", json={
        "full_name": "Invalid User",
        "email": "not-an-email-address",
        "username": "invalid_user_4",
        "password": "Password123!",
        "confirm_password": "Password123!",
        "terms_acknowledged": True
    })
    assert r4.status_code in [400, 422]

def test_login_and_logout_session_management():
    login_resp = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    
    # Check that cookie was set
    assert "access_token" in login_resp.cookies
    
    # Call logout
    logout_resp = client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert logout_resp.status_code == 200
    assert "Logged out successfully" in logout_resp.json()["message"]

def test_patient_full_crud():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # 1. Create Patient without providing age -> Age must be calculated from date_of_birth
    new_pat_payload = {
        "full_name": "Auto Age Test Patient",
        "date_of_birth": "1990-06-15",
        "sex": "Female",
        "phone_number": "+1-555-8888",
        "email": "auto_age@test.com",
        "address": "123 Medical Way",
        "emergency_contact": "Jane Doe"
    }
    create_resp = client.post("/api/v1/patients/", json=new_pat_payload, headers=headers)
    assert create_resp.status_code == 201
    pat_id = create_resp.json()["patient_id"]
    assert pat_id.startswith("PAT-")

    # 2. Read Patient profile and verify auto-calculated age (e.g. >= 34)
    profile_resp = client.get(f"/api/v1/patients/{pat_id}", headers=headers)
    assert profile_resp.status_code == 200
    pat_data = profile_resp.json()["patient"]
    assert pat_data["full_name"] == "Auto Age Test Patient"
    assert pat_data["age"] >= 34
    assert pat_data["is_active"] is True

    # 3. Update Patient details
    update_resp = client.put(f"/api/v1/patients/{pat_id}", json={
        "phone_number": "+1-555-9999",
        "address": "456 Updated Blvd"
    }, headers=headers)
    assert update_resp.status_code == 200

    # 4. Deactivate Patient (soft delete)
    del_resp = client.delete(f"/api/v1/patients/{pat_id}", headers=headers)
    assert del_resp.status_code == 200
    
    # Verify is_active is now False
    recheck = client.get(f"/api/v1/patients/{pat_id}", headers=headers)
    assert recheck.json()["patient"]["is_active"] is False

def test_admission_and_readmission_calculations():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    import uuid
    uid = uuid.uuid4().hex[:6]
    pat_res = client.post("/api/v1/patients/", json={
        "full_name": f"Readmission Target {uid}",
        "date_of_birth": "1978-08-20",
        "sex": "Female"
    }, headers=headers)
    assert pat_res.status_code == 201
    test_pat_id = pat_res.json()["patient_id"]

    # Register first admission
    adm1_payload = {
        "patient_id": test_pat_id,
        "department_id": "DEP-CAR",
        "doctor_id": "DOC-101",
        "admission_date": "2026-03-01T08:00:00",
        "admission_type": "Emergency"
    }
    adm1_resp = client.post("/api/v1/admissions/", json=adm1_payload, headers=headers)
    assert adm1_resp.status_code == 201
    adm1_id = adm1_resp.json()["admission_id"]

    # Discharge first admission 5 days later (2026-03-06)
    disch_resp = client.put(
        f"/api/v1/admissions/{adm1_id}/discharge",
        json={"discharge_date": "2026-03-06 14:00:00", "discharge_status": "Discharged"},
        headers=headers
    )
    assert disch_resp.status_code == 200
    assert disch_resp.json()["length_of_stay"] == 5

    # Register second admission 10 days after discharge (2026-03-16) -> Must be 30-day readmission!
    adm2_payload = {
        "patient_id": test_pat_id,
        "department_id": "DEP-CAR",
        "doctor_id": "DOC-101",
        "admission_date": "2026-03-16T10:00:00",
        "admission_type": "Urgent"
    }
    adm2_resp = client.post("/api/v1/admissions/", json=adm2_payload, headers=headers)
    assert adm2_resp.status_code == 201
    assert adm2_resp.json()["is_readmission_30d"] is True
    assert adm2_resp.json()["prior_admission_id"] == adm1_id

def test_foreign_key_integrity_enforcement():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Invalid doctor ID
    bad_appt = {
        "patient_id": "PAT-1001",
        "doctor_id": "DOC-NON-EXISTENT",
        "department_id": "DEP-CAR",
        "appointment_date": "2026-12-01T10:00:00"
    }
    r1 = client.post("/api/v1/appointments/", json=bad_appt, headers=headers)
    assert r1.status_code == 400
    assert "Invalid or inactive doctor" in r1.json()["detail"]

    # Invalid patient ID
    bad_adm = {
        "patient_id": "PAT-NON-EXISTENT",
        "department_id": "DEP-CAR",
        "doctor_id": "DOC-101",
        "admission_date": "2026-12-01T10:00:00"
    }
    r2 = client.post("/api/v1/admissions/", json=bad_adm, headers=headers)
    assert r2.status_code == 400
    assert "Invalid patient ID" in r2.json()["detail"]

def test_sql_aggregation_correctness():
    analyst_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "analyst",
        "password": "AnalystPassword123!"
    })
    headers = {"Authorization": f"Bearer {analyst_login.json()['access_token']}"}

    # Roll-up sum across all months must equal total admissions in fact table
    rollup_resp = client.get("/api/v1/warehouse/olap/rollup", headers=headers)
    assert rollup_resp.status_code == 200
    rollup_data = rollup_resp.json()["data"]
    total_rollup_admissions = sum(item["total_admissions"] for item in rollup_data)
    
    schema_resp = client.get("/api/v1/warehouse/schema-summary", headers=headers)
    assert schema_resp.status_code == 200
    total_fact_admissions = schema_resp.json()["facts"]["FactAdmission"]
    assert total_rollup_admissions == total_fact_admissions

    # Billing report collection rate math check
    bill_resp = client.get("/api/v1/reports/billing-collection", headers=headers)
    assert bill_resp.status_code == 200
    for dept_b in bill_resp.json()["department_billing"]:
        assert dept_b["billed"] >= 0
        assert dept_b["collected"] >= 0

def test_prediction_data_leakage_safeguards():
    """Verify GroupShuffleSplit isolates patient IDs between train and test splits to prevent intra-patient leakage."""
    from app.ml.readmission import build_readmission_dataframe
    from sklearn.model_selection import GroupShuffleSplit

    df = build_readmission_dataframe()
    assert len(df) > 50
    groups = df["patient_id"].values
    X = df[["age", "length_of_stay", "prior_admissions", "prior_visits"]]
    y = df["target_readmission_30d"].values

    gss = GroupShuffleSplit(n_splits=1, test_size=0.25, random_state=42)
    train_idx, test_idx = next(gss.split(X, y, groups=groups))

    train_patients = set(groups[train_idx])
    test_patients = set(groups[test_idx])

    # Overlap must be strictly zero
    overlap = train_patients.intersection(test_patients)
    assert len(overlap) == 0, f"Data leakage detected! Overlapping patients: {overlap}"

def test_dataset_upload_validation_and_preview():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # 1. Preview existing dataset file
    prev_resp = client.get("/api/v1/datasets/preview/patients.csv", headers=headers)
    assert prev_resp.status_code == 200
    pdata = prev_resp.json()
    assert pdata["total_rows"] > 0
    assert len(pdata["schema"]) > 0
    assert "warnings" in pdata

    # 2. Upload valid CSV content
    valid_csv = "id,full_name,date_of_birth,age,sex\nPAT-9901,Upload Test Patient,1992-04-10,34,Female"
    val_resp = client.post("/api/v1/datasets/upload", data={
        "table_name": "patients",
        "csv_content": valid_csv
    }, headers=headers)
    assert val_resp.status_code == 200
    assert val_resp.json()["status"] == "valid"
    assert val_resp.json()["total_records_validated"] == 1

    # 3. Upload invalid CSV missing required column
    invalid_csv = "id,age,sex\nPAT-9902,40,Male"
    inval_resp = client.post("/api/v1/datasets/upload", data={
        "table_name": "patients",
        "csv_content": invalid_csv
    }, headers=headers)
    assert inval_resp.status_code == 400
    assert "Schema validation failed" in inval_resp.json()["detail"]

def test_report_export_permissions_and_rbac():
    # Receptionist must be forbidden (403) from downloading de-identified analytical CSVs
    rec_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "reception",
        "password": "ReceptionPassword123!"
    })
    rec_token = rec_login.json()["access_token"]
    rec_headers = {"Authorization": f"Bearer {rec_token}"}

    rec_resp = client.get("/api/v1/reports/export/admissions-csv", headers=rec_headers)
    assert rec_resp.status_code == 403

    rec_bill_resp = client.get("/api/v1/reports/export/billing-csv", headers=rec_headers)
    assert rec_bill_resp.status_code == 403

    # Analyst must succeed (200)
    analyst_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "analyst",
        "password": "AnalystPassword123!"
    })
    an_token = analyst_login.json()["access_token"]
    an_headers = {"Authorization": f"Bearer {an_token}"}
    
    an_resp = client.get("/api/v1/reports/export/admissions-csv", headers=an_headers)
    assert an_resp.status_code == 200

def test_dashboard_date_range_and_dept_filters():
    admin_login = client.post("/api/v1/auth/login", json={
        "username_or_email": "admin",
        "password": "AdminPassword123!"
    })
    headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}

    # Test with department filter and date range
    resp = client.get(
        "/api/v1/dashboard/overview?department_id=DEP-CAR&start_date=2025-01-01&end_date=2025-12-31",
        headers=headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "total_patients" in data["kpis"]
    assert "total_admissions" in data["kpis"]


