from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db
from app.models.models import Invoice, Order
from app.schemas.schemas import OrderOut

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("", response_model=List[dict])
def get_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).options(
        joinedload(Invoice.order).joinedload(Order.customer)
    ).order_by(Invoice.issued_date.desc()).all()

    results = []
    for inv in invoices:
        results.append({
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "order_id": inv.order_id,
            "order_number": inv.order.order_number if inv.order else "",
            "customer_name": inv.customer_name,
            "amount": inv.amount,
            "issued_date": inv.issued_date,
            "payment_status": inv.order.payment_status if inv.order else "Unpaid",
            "payment_method": inv.order.payment_method if inv.order else "N/A"
        })
    return results

@router.get("/{invoice_id}", response_model=dict)
def get_invoice_details(invoice_id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")

    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items)
    ).filter(Order.id == inv.order_id).first()

    return {
        "invoice_number": inv.invoice_number,
        "issued_date": inv.issued_date,
        "order": OrderOut.model_validate(order) if order else None
    }
