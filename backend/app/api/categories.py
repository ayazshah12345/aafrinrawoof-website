import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_admin, log_activity
from app.models.models import Category, Admin
from app.schemas.schemas import CategoryOut, CategoryCreate, CategoryUpdate
from app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/categories", tags=["Categories"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

@router.get("", response_model=List[CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.sort_order.asc(), Category.name.asc()).all()

@router.get("/{category_id}", response_model=CategoryOut)
def get_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category

@router.post("", response_model=CategoryOut)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    existing = db.query(Category).filter(Category.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    slug = slugify(payload.name)
    category = Category(
        name=payload.name,
        slug=slug,
        description=payload.description,
        image_url=payload.image_url,
        is_active=payload.is_active,
        sort_order=payload.sort_order
    )
    db.add(category)
    db.commit()
    db.refresh(category)

    log_activity(db, current_admin.id, "Create Category", "Category", category.id, f"Created category '{category.name}'")
    return category

@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != category.name:
        update_data["slug"] = slugify(update_data["name"])

    for key, value in update_data.items():
        setattr(category, key, value)

    db.commit()
    db.refresh(category)

    log_activity(db, current_admin.id, "Update Category", "Category", category.id, f"Updated category '{category.name}'")
    return category

@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    name = category.name
    db.delete(category)
    db.commit()

    log_activity(db, current_admin.id, "Delete Category", "Category", category_id, f"Deleted category '{name}'")
    return {"message": f"Category '{name}' deleted successfully"}

@router.post("/upload-image")
async def upload_category_image(
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin)
):
    url = await upload_image(file, folder="categories")
    return {"url": url}
