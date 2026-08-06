from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field

# Auth
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: "AdminOut"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    avatar_url: Optional[str] = None
    is_active: bool
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# Category
class CategoryBase(BaseModel):
    name: str
    slug: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

class CategoryOut(CategoryBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Product
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float = Field(..., gt=0)
    discount_price: Optional[float] = 0.0
    stock: int = Field(..., ge=0)
    sku: Optional[str] = None
    images: List[str] = []
    is_featured: bool = False
    is_new_arrival: bool = False
    is_bestseller: bool = False
    is_active: bool = True

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float = Field(..., ge=0)
    discount_price: Optional[float] = 0.0
    stock: int = Field(..., ge=0)
    sku: Optional[str] = ""
    images: Optional[List[str]] = []
    is_featured: Optional[bool] = False
    is_new_arrival: Optional[bool] = False
    is_bestseller: Optional[bool] = False
    is_active: Optional[bool] = True

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    discount_price: Optional[float] = None
    stock: Optional[int] = None
    sku: Optional[str] = None
    images: Optional[List[str]] = None
    is_featured: Optional[bool] = None
    is_new_arrival: Optional[bool] = None
    is_bestseller: Optional[bool] = None
    is_active: Optional[bool] = None

class ProductOut(ProductBase):
    id: int
    slug: str
    category: Optional[CategoryOut] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Customer
class CustomerOut(BaseModel):
    id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    avatar: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    total_orders: int
    total_spent: float
    last_login: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerRegister(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None

class CustomerLogin(BaseModel):
    identifier: str  # Email or Phone
    password: str

class CustomerToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer: CustomerOut

class CustomerAdminCreate(BaseModel):
    full_name: str
    email: str
    password: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "India"
    postal_code: Optional[str] = None

# Order
class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    price: float
    quantity: int
    total: float

    class Config:
        from_attributes = True

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: int
    customer: Optional[CustomerOut] = None
    subtotal: float
    tax: float
    shipping: float
    discount: float
    total_amount: float
    payment_method: str
    payment_status: str
    order_status: str
    shipping_address: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    order_items: List[OrderItemOut] = []

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    order_status: str  # Pending, Confirmed, Packed, Shipped, Delivered, Cancelled
    payment_status: Optional[str] = None

class OrderItemCreate(BaseModel):
    product_id: Optional[int] = 1
    quantity: Optional[int] = 1

class OrderCreate(BaseModel):
    customer_name: Optional[str] = "Valued Customer"
    customer_phone: Optional[str] = None
    customer_email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    notes: Optional[str] = None
    payment_method: Optional[str] = "UPI Direct / Phone (+91 96292 17907)"
    order_status: Optional[str] = "Confirmed"
    items: Optional[List[OrderItemCreate]] = []
    coupon_code: Optional[str] = None

# Coupon
class CouponBase(BaseModel):
    code: str
    discount_type: str  # percentage, fixed
    discount_value: float
    min_purchase: float = 0.0
    max_usage: int = 100
    expiry_date: Optional[datetime] = None
    is_active: bool = True

class CouponCreate(CouponBase):
    pass

class CouponUpdate(BaseModel):
    code: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    max_usage: Optional[int] = None
    expiry_date: Optional[datetime] = None
    is_active: Optional[bool] = None

class CouponOut(CouponBase):
    id: int
    used_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# Review
class ReviewOut(BaseModel):
    id: int
    product_id: int
    product: Optional[ProductOut] = None
    customer_name: str
    customer_email: str
    rating: int
    comment: str
    status: str
    admin_reply: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ReviewStatusUpdate(BaseModel):
    status: str  # approved, rejected
    admin_reply: Optional[str] = None

# Settings
class SettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    store_logo: Optional[str] = None
    favicon: Optional[str] = None
    contact_number: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    whatsapp: Optional[str] = None
    instagram: Optional[str] = None
    facebook: Optional[str] = None
    shipping_charge: Optional[float] = None
    tax_percentage: Optional[float] = None
    currency: Optional[str] = None
    upi_qr_code: Optional[str] = None
    upi_id: Optional[str] = None
    store_banner: Optional[str] = None
    maintenance_mode: Optional[bool] = None

class SettingsOut(BaseModel):
    id: int
    store_name: str
    store_logo: Optional[str]
    favicon: Optional[str]
    contact_number: Optional[str]
    email: Optional[str]
    address: Optional[str]
    whatsapp: Optional[str]
    instagram: Optional[str]
    facebook: Optional[str]
    shipping_charge: float
    tax_percentage: float
    currency: str
    upi_qr_code: Optional[str]
    upi_id: Optional[str]
    store_banner: Optional[str]
    maintenance_mode: bool

    class Config:
        from_attributes = True

# Activity Log
class ActivityLogOut(BaseModel):
    id: int
    admin_id: Optional[int]
    action: str
    entity_type: Optional[str]
    entity_id: Optional[str]
    details: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

# Analytics & Reports
class AnalyticsSummary(BaseModel):
    total_products: int
    total_orders: int
    total_customers: int
    total_revenue: float
    today_revenue: float
    monthly_revenue: float
    pending_orders: int
    completed_orders: int
    cancelled_orders: int
    low_stock_products: int

Token.model_rebuild()
