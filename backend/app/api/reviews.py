from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, get_current_admin, log_activity
from app.models.models import Review, Admin
from app.schemas.schemas import ReviewOut, ReviewStatusUpdate

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("", response_model=List[ReviewOut])
def get_reviews(
    status: Optional[str] = None,
    product_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Review).options(joinedload(Review.product))
    if status:
        query = query.filter(Review.status == status)
    if product_id:
        query = query.filter(Review.product_id == product_id)
    return query.order_by(Review.created_at.desc()).all()

@router.patch("/{review_id}/status", response_model=ReviewOut)
def update_review_status(
    review_id: int,
    payload: ReviewStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    review.status = payload.status
    if payload.admin_reply is not None:
        review.admin_reply = payload.admin_reply

    db.commit()
    db.refresh(review)

    log_activity(db, current_admin.id, "Update Review Status", "Review", review.id, f"Review #{review.id} status changed to {payload.status}")
    return db.query(Review).options(joinedload(Review.product)).filter(Review.id == review.id).first()

@router.delete("/{review_id}")
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    db.delete(review)
    db.commit()

    log_activity(db, current_admin.id, "Delete Review", "Review", review_id, f"Deleted review #{review_id}")
    return {"message": "Review deleted successfully"}
