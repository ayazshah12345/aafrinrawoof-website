import math
import re
import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, get_current_admin, log_activity
from app.models.models import Product, Category, Admin
from app.schemas.schemas import ProductOut, ProductCreate, ProductUpdate
from app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/products", tags=["Products"])

def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    return re.sub(r'[\s_-]+', '-', text)

@router.get("", response_model=dict)
def get_products(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    is_active: Optional[bool] = None,
    is_featured: Optional[bool] = None,
    low_stock: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product).options(joinedload(Product.category))

    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Product.name.ilike(search_pattern)) | 
            (Product.sku.ilike(search_pattern)) |
            (Product.description.ilike(search_pattern))
        )
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)
    if is_featured is not None:
        query = query.filter(Product.is_featured == is_featured)
    if low_stock:
        query = query.filter(Product.stock <= 5)

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    products = query.order_by(Product.id.desc()).offset(offset).limit(limit).all()

    return {
        "items": [ProductOut.model_validate(p) for p in products],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).options(joinedload(Product.category)).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    sku = payload.sku
    if not sku or not sku.strip():
        sku = f"AFSOO-{uuid.uuid4().hex[:8].upper()}"

    existing_sku = db.query(Product).filter(Product.sku == sku).first()
    if existing_sku:
        sku = f"AFSOO-{uuid.uuid4().hex[:8].upper()}"

    base_slug = slugify(payload.name)
    slug = base_slug
    counter = 1
    while db.query(Product).filter(Product.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    product = Product(
        name=payload.name,
        slug=slug,
        description=payload.description,
        category_id=payload.category_id,
        price=payload.price,
        discount_price=payload.discount_price or 0.0,
        stock=payload.stock,
        sku=sku,
        images=payload.images or [],
        is_featured=payload.is_featured,
        is_new_arrival=payload.is_new_arrival,
        is_bestseller=payload.is_bestseller,
        is_active=payload.is_active
    )
    db.add(product)
    db.commit()
    db.refresh(product)

    # Broadcast New Product Launch Email to All Registered Customer Accounts
    try:
        from app.models.models import Customer
        from app.services.email_service import send_new_product_broadcast

        customers = db.query(Customer.email).filter(Customer.email != None).all()
        recipient_emails = [c[0] for c in customers if c[0] and "@" in c[0]]

        if recipient_emails:
            first_image = product.images[0] if product.images and len(product.images) > 0 else ""
            send_new_product_broadcast(
                recipient_emails=recipient_emails,
                product_name=product.name,
                price=product.price,
                image_url=first_image,
                description=product.description or ""
            )
    except Exception as broadcast_err:
        print("New product broadcast email notice:", broadcast_err)

    log_activity(db, current_admin.id, "Create Product", "Product", product.id, f"Created product {product.name} (₹{product.price})")
    
    # Reload with category relation
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()

@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != product.name:
        base_slug = slugify(update_data["name"])
        slug = base_slug
        counter = 1
        while db.query(Product).filter(Product.slug == slug, Product.id != product_id).first():
            slug = f"{base_slug}-{counter}"
            counter += 1
        product.slug = slug

    if "sku" in update_data and update_data["sku"] != product.sku:
        existing_sku = db.query(Product).filter(Product.sku == update_data["sku"], Product.id != product_id).first()
        if existing_sku:
            raise HTTPException(status_code=400, detail="Product SKU already exists")

    for key, value in update_data.items():
        setattr(product, key, value)

    db.commit()
    db.refresh(product)

    log_activity(db, current_admin.id, "Update Product", "Product", product.id, f"Updated product {product.name}")
    
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()

@router.patch("/{product_id}/status", response_model=ProductOut)
def toggle_product_status(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.is_active = not product.is_active
    db.commit()
    db.refresh(product)

    log_activity(db, current_admin.id, "Toggle Product Status", "Product", product.id, f"Toggled status of {product.name} to {product.is_active}")
    return db.query(Product).options(joinedload(Product.category)).filter(Product.id == product.id).first()

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product_name = product.name
    db.delete(product)
    db.commit()

    log_activity(db, current_admin.id, "Delete Product", "Product", product_id, f"Deleted product {product_name}")
    return {"message": f"Product '{product_name}' deleted successfully"}

@router.post("/upload-images")
async def upload_product_images(
    files: List[UploadFile] = File(...),
    current_admin: Admin = Depends(get_current_admin)
):
    urls = []
    for file in files:
        url = await upload_image(file, folder="products")
        urls.append(url)
    return {"urls": urls}
