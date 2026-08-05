import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_admin, log_activity
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.models.models import Admin, Customer
from app.schemas.schemas import LoginRequest, Token, AdminOut, CustomerRegister, CustomerLogin, CustomerToken, CustomerOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    if not admin.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin account is inactive"
        )
    
    admin.last_login = datetime.datetime.utcnow()
    db.commit()
    db.refresh(admin)
    
    token = create_access_token(subject=admin.id)
    log_activity(db, admin.id, "Admin Login", "Admin", admin.id, f"Admin logged in from {admin.email}")
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "admin": admin
    }

@router.get("/me", response_model=AdminOut)
def get_me(current_admin: Admin = Depends(get_current_admin)):
    return current_admin

# Customer Authentication Endpoints
@router.post("/customer/register", response_model=CustomerToken)
def customer_register(payload: CustomerRegister, db: Session = Depends(get_db)):
    email_clean = payload.email.lower().strip()
    phone_clean = payload.phone.strip() if payload.phone else None

    existing_email = db.query(Customer).filter(Customer.email == email_clean).first()
    if existing_email and existing_email.hashed_password:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists. Please log in."
        )

    if phone_clean:
        phone_existing = db.query(Customer).filter(Customer.phone == phone_clean).first()
        if phone_existing and phone_existing.hashed_password and phone_existing.id != getattr(existing_email, 'id', None):
            raise HTTPException(
                status_code=400,
                detail="An account with this phone number already exists."
            )

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
            country="India",
            last_login=datetime.datetime.utcnow()
        )
        db.add(customer)

    db.commit()
    db.refresh(customer)

    # Send Welcome Greeting Email
    from app.services.email_service import send_welcome_email
    send_welcome_email(customer.email, customer.full_name)

    token = create_access_token(subject=f"customer:{customer.id}")
    log_activity(
        db,
        action="CUSTOMER_REGISTER",
        entity_type="Customer",
        entity_id=customer.id,
        details=f"New Customer Registered: {customer.full_name} ({customer.email}, Phone: {customer.phone or 'N/A'})"
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": CustomerOut.model_validate(customer)
    }

@router.post("/customer/login", response_model=CustomerToken)
def customer_login(payload: CustomerLogin, db: Session = Depends(get_db)):
    identifier = payload.identifier.strip()
    customer = db.query(Customer).filter(
        (Customer.email == identifier.lower()) | (Customer.phone == identifier)
    ).first()

    if not customer or not customer.hashed_password or not verify_password(payload.password, customer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password"
        )

    customer.last_login = datetime.datetime.utcnow()
    db.commit()
    db.refresh(customer)

    token = create_access_token(subject=f"customer:{customer.id}")
    log_activity(
        db,
        action="CUSTOMER_LOGIN",
        entity_type="Customer",
        entity_id=customer.id,
        details=f"Customer Logged In: {customer.full_name} ({customer.email})"
    )
    return {
        "access_token": token,
        "token_type": "bearer",
        "customer": CustomerOut.model_validate(customer)
    }

from fastapi import Request

@router.get("/customer/me", response_model=CustomerOut)
def get_customer_me(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("authorization") or request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token")

    token = auth_header.split(" ")[1]
    payload = decode_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid session token")

    sub = str(payload["sub"])
    if not sub.startswith("customer:"):
        raise HTTPException(status_code=401, detail="Invalid token type")

    customer_id = int(sub.split(":")[1])
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer profile not found")

    return CustomerOut.model_validate(customer)
