from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_operational_db
from app.models.operational import Invoice, Payment, Patient, Department, PaymentStatus, User
from app.schemas.clinical import PaymentCreate
from app.api.deps import require_roles, log_audit_event

router = APIRouter(prefix="/billing", tags=["Billing & Payments"])

billing_staff = require_roles(["Administrator", "Receptionist", "Data Analyst"])
billing_writers = require_roles(["Administrator", "Receptionist"])

@router.get("/invoices")
def list_invoices(
    status_filter: Optional[str] = None,
    department_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(billing_staff),
    db: Session = Depends(get_operational_db)
):
    query = db.query(Invoice)
    if status_filter:
        query = query.filter(Invoice.payment_status == status_filter)
    if department_id:
        query = query.filter(Invoice.department_id == department_id)
        
    total = query.count()
    invs = query.order_by(Invoice.invoice_date.desc()).offset(skip).limit(limit).all()
    
    # Calculate overall portfolio totals
    total_billed = db.query(func.sum(Invoice.amount_billed)).scalar() or 0.0
    total_paid = db.query(func.sum(Invoice.amount_paid)).scalar() or 0.0
    total_outstanding = db.query(func.sum(Invoice.outstanding_balance)).scalar() or 0.0
    
    return {
        "summary": {
            "total_billed": round(float(total_billed), 2),
            "total_paid": round(float(total_paid), 2),
            "total_outstanding": round(float(total_outstanding), 2),
            "collection_rate_pct": round((total_paid / total_billed * 100), 1) if total_billed > 0 else 0.0
        },
        "total": total,
        "invoices": [
            {
                "id": inv.id,
                "patient_id": inv.patient_id,
                "patient_name": inv.patient.full_name if inv.patient else "Unknown",
                "department_id": inv.department_id,
                "service_category": inv.service_category,
                "invoice_date": inv.invoice_date.isoformat(),
                "amount_billed": round(inv.amount_billed, 2),
                "amount_paid": round(inv.amount_paid, 2),
                "outstanding_balance": round(inv.outstanding_balance, 2),
                "payment_status": inv.payment_status
            }
            for inv in invs
        ]
    }

@router.post("/payments", status_code=status.HTTP_201_CREATED)
def record_payment(
    req: PaymentCreate,
    current_user: User = Depends(billing_writers),
    db: Session = Depends(get_operational_db)
):
    inv = db.query(Invoice).filter(Invoice.id == req.invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice record not found.")
        
    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than zero.")
        
    if req.amount > inv.outstanding_balance + 0.01:
        raise HTTPException(
            status_code=400,
            detail=f"Payment amount (${req.amount:.2f}) exceeds outstanding balance (${inv.outstanding_balance:.2f})."
        )
        
    # Auto-generate next Payment ID
    last_pay = db.query(Payment).order_by(Payment.id.desc()).first()
    next_num = int(last_pay.id.split("-")[1]) + 1 if last_pay and "-" in last_pay.id else 8001
    new_id = f"PAY-{next_num}"
    
    payment = Payment(
        id=new_id,
        invoice_id=inv.id,
        patient_id=inv.patient_id,
        payment_date=datetime.now(timezone.utc),
        amount=round(req.amount, 2),
        payment_method=req.payment_method,
        transaction_reference=f"TXN-RECEIPT-{new_id}"
    )
    db.add(payment)
    
    # Update invoice paid and outstanding amounts consistently
    inv.amount_paid = round(inv.amount_paid + req.amount, 2)
    inv.outstanding_balance = round(max(0.0, inv.amount_billed - inv.amount_paid), 2)
    inv.payment_status = (
        PaymentStatus.PAID.value if inv.outstanding_balance <= 0.01 else PaymentStatus.PARTIAL.value
    )
    
    db.commit()
    log_audit_event(db, current_user, "PAYMENT_RECORDED", "billing", f"Recorded payment {new_id} for invoice {inv.id} (${req.amount:.2f})")
    return {
        "message": "Payment recorded successfully.",
        "payment_id": new_id,
        "remaining_balance": inv.outstanding_balance,
        "new_status": inv.payment_status
    }
