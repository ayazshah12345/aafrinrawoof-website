import os
import uuid
from typing import Optional
from fastapi import UploadFile
from app.core.config import settings

# Attempt Cloudinary import
try:
    import cloudinary
    import cloudinary.uploader
    HAS_CLOUDINARY = True
except ImportError:
    HAS_CLOUDINARY = False

if HAS_CLOUDINARY and settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )
    CLOUDINARY_ACTIVE = True
else:
    CLOUDINARY_ACTIVE = False

# Ensure local static upload directory exists
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

async def upload_image(file: UploadFile, folder: str = "products") -> str:
    """
    Uploads file to Cloudinary if credentials are active,
    otherwise saves to backend/uploads directory and returns static URL.
    """
    contents = await file.read()
    
    if CLOUDINARY_ACTIVE:
        try:
            result = cloudinary.uploader.upload(
                contents,
                folder=f"afrin_handmade/{folder}",
                resource_type="image"
            )
            return result.get("secure_url")
        except Exception as e:
            print(f"Cloudinary upload failed, falling back to local: {e}")
            
    # Local fallback storage
    ext = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    with open(filepath, "wb") as f:
        f.write(contents)
        
    return f"/static/uploads/{filename}"
