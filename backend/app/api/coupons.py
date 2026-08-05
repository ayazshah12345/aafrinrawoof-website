from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_admin, log_activity
from app.models.models import Coupon, Admin
from app.schemas.schemas import CouponOut, CouponCreate, CouponUpdate

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.get("", response_model=List[CouponOut])
def get_coupons(db: Session = Depends(get_db)):
    return db.query(Coupon).order_by(Coupon.created_at.desc()).all()

@router.post("", response_model=CouponOut)
def create_coupon(
    payload: CouponCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    existing = db.query(Coupon).filter(Coupon.code == payload.code.upper()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Coupon code already exists")

    coupon = Coupon(
        code=payload.code.upper(),
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_purchase=payload.min_purchase,
        max_usage=payload.max_usage,
        expiry_date=payload.expiry_date,
        is_active=payload.is_active
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)

    log_activity(db, current_admin.id, "Create Coupon", "Coupon", coupon.id, f"Created coupon '{coupon.code}'")
    return coupon

@router.put("/{coupon_id}", response_model=CouponOut)
def update_coupon(
    coupon_id: int,
    payload: CouponUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    data = payload.model_dump(exclude_unset=True)
    if "code" in data:
        data["code"] = data["code"].upper()
        existing = db.query(Coupon).filter(Coupon.code == data["code"], Coupon.id != coupon_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Coupon code already exists")

    for key, value in data.items():
        setattr(coupon, key, value)

    db.commit()
    db.refresh(coupon)

    log_activity(db, current_admin.id, "Update Coupon", "Coupon", coupon.id, f"Updated coupon '{coupon.code}'")
    return coupon

@router.patch("/{coupon_id}/toggle", response_model=CouponOut)
def toggle_coupon_status(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon.is_active = not coupon.is_active
    db.commit()
    db.refresh(coupon)

    log_activity(db, current_admin.id, "Toggle Coupon Status", "Coupon", coupon.id, f"Toggled coupon '{coupon.code}' to {coupon.is_active}")
    return coupon

@router.delete("/{coupon_id}")
def delete_coupon(
    coupon_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    coupon = db.query(Coupon).filter(Coupon.id == coupon_id).first()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    code = coupon.code
    db.delete(coupon)
    db.commit()

    log_activity(db, current_admin.id, "Delete Coupon", "Coupon", coupon_id, f"Deleted coupon '{code}'")
    return {"message": f"Coupon '{code}' deleted successfully"}
