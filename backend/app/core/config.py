import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Afsoo Admin API"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    
    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-admin-key-afsoo-design-2026-secure-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days session
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./admin_dashboard.db")
    
    # Cloudinary
    CLOUDINARY_CLOUD_NAME: str = os.getenv("CLOUDINARY_CLOUD_NAME", "")
    CLOUDINARY_API_KEY: str = os.getenv("CLOUDINARY_API_KEY", "")
    CLOUDINARY_API_SECRET: str = os.getenv("CLOUDINARY_API_SECRET", "")
    
    # SMTP Email Settings
    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", 587))
    SMTP_USER: str = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    EMAILS_FROM_EMAIL: str = os.getenv("EMAILS_FROM_EMAIL", "support@afsoo.com")
    EMAILS_FROM_NAME: str = os.getenv("EMAILS_FROM_NAME", "Afsoo Crafts Studio")
    
    # Frontend URL for CORS (set this on Railway to your Vercel domain)
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "")
    
    # CORS — built dynamically based on environment
    @property
    def ALLOWED_ORIGINS(self) -> list:
        origins = [
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173",
        ]
        # Add production frontend URL if set
        if self.FRONTEND_URL:
            origins.append(self.FRONTEND_URL)
            # Also allow www variant
            if self.FRONTEND_URL.startswith("https://") and not self.FRONTEND_URL.startswith("https://www."):
                origins.append(self.FRONTEND_URL.replace("https://", "https://www."))
        return origins

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "ignore"

settings = Settings()
