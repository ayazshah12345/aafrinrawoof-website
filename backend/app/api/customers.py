import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db
from app.models.models import Customer, Order, ActivityLog
from app.schemas.schemas import CustomerOut, OrderOut, CustomerAdminCreate, ActivityLogOut
from app.core.security import get_password_hash
from app.api.deps import log_activity
import datetime

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=dict)
def get_customers(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Customer)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Customer.full_name.ilike(pattern)) |
            (Customer.email.ilike(pattern)) |
            (Customer.phone.ilike(pattern))
        )

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    customers = query.order_by(Customer.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "items": [CustomerOut.model_validate(c) for c in customers],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/auth-logs", response_model=dict)
def get_customer_auth_logs(
    search: Optional[str] = None,
    action_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(ActivityLog).filter(
        (ActivityLog.action.in_(["CUSTOMER_REGISTER", "CUSTOMER_LOGIN"])) |
        (ActivityLog.entity_type == "Customer")
    )

    if action_filter and action_filter != "ALL":
        query = query.filter(ActivityLog.action == action_filter)

    if search:
        pattern = f"%{search}%"
        query = query.filter(ActivityLog.details.ilike(pattern))

    logs = query.order_by(ActivityLog.created_at.desc()).limit(100).all()

    return {
        "logs": [
            {
                "id": l.id,
                "admin_id": l.admin_id,
                "action": l.action,
                "entity_type": l.entity_type,
                "entity_id": l.entity_id,
                "details": l.details,
                "ip_address": l.ip_address,
                "created_at": l.created_at
            } for l in logs
        ]
    }

@router.post("", response_model=CustomerOut)
def admin_create_customer(payload: CustomerAdminCreate, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    phone_clean = payload.phone.strip() if payload.phone else None

    existing_email = db.query(Customer).filter(Customer.email == email_clean).first()
    if existing_email and existing_email.hashed_password:
        raise HTTPException(status_code=400, detail="Customer with this email address already exists.")

    hashed_pw = get_password_hash(payload.password)

    if existing_email:
        customer = existing_email
        customer.full_name = payload.full_name.strip()
        customer.hashed_password = hashed_pw
        if phone_clean:
            customer.phone = phone_clean
        if payload.address:
            customer.address = payload.address.strip()
        if payload.city:
            customer.city = payload.city.strip()
        if payload.postal_code:
            customer.postal_code = payload.postal_code.strip()
        customer.last_login = datetime.datetime.utcnow()
    else:
        customer = Customer(
            full_name=payload.full_name.strip(),
            email=email_clean,
            hashed_password=hashed_pw,
            phone=phone_clean,
            address=payload.address.strip() if payload.address else None,
            city=payload.city.strip() if payload.city else None,
            postal_code=payload.postal_code.strip() if payload.postal_code else None,
            country=payload.country or "India",
            last_login=datetime.datetime.utcnow()
        )
        db.add(customer)

    db.commit()
    db.refresh(customer)

    # Send Welcome Greeting Email
    from app.services.email_service import send_welcome_email
    send_welcome_email(customer.email, customer.full_name)

    log_activity(
        db,
        action="CUSTOMER_REGISTER",
        entity_type="Customer",
        entity_id=customer.id,
        details=f"Customer registered via Admin Panel: {customer.full_name} ({customer.email})"
    )

    return CustomerOut.model_validate(customer)

@router.get("/{customer_id}", response_model=dict)
def get_customer_details(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    orders = db.query(Order).options(joinedload(Order.order_items)).filter(
        Order.customer_id == customer_id
    ).order_by(Order.created_at.desc()).all()

    return {
        "customer": CustomerOut.model_validate(customer),
        "orders": [OrderOut.model_validate(o) for o in orders]
    }
