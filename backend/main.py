import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import engine, Base
from app.api import auth, products, categories, orders, customers, coupons, reviews, sales, settings as settings_api, invoices, activity

# Create tables on startup if not present
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file uploads serving
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/static/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# Include Routers
v1 = settings.API_V1_STR
app.include_router(auth.router, prefix=v1)
app.include_router(products.router, prefix=v1)
app.include_router(categories.router, prefix=v1)
app.include_router(orders.router, prefix=v1)
app.include_router(customers.router, prefix=v1)
app.include_router(coupons.router, prefix=v1)
app.include_router(reviews.router, prefix=v1)
app.include_router(sales.router, prefix=v1)
app.include_router(settings_api.router, prefix=v1)
app.include_router(invoices.router, prefix=v1)
app.include_router(activity.router, prefix=v1)

@app.get("/")
def root():
    return {
        "status": "online",
        "name": settings.PROJECT_NAME,
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
