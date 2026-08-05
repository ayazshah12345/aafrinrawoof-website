from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_admin, log_activity
from app.models.models import Setting, Admin
from app.schemas.schemas import SettingsOut, SettingsUpdate
from app.services.cloudinary_service import upload_image

router = APIRouter(prefix="/settings", tags=["Settings"])

def get_or_create_settings(db: Session) -> Setting:
    setting = db.query(Setting).first()
    if not setting:
        setting = Setting()
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.get("", response_model=SettingsOut)
def get_settings(db: Session = Depends(get_db)):
    return get_or_create_settings(db)

@router.put("", response_model=SettingsOut)
def update_settings(
    payload: SettingsUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    setting = get_or_create_settings(db)
    data = payload.model_dump(exclude_unset=True)

    for key, value in data.items():
        setattr(setting, key, value)

    db.commit()
    db.refresh(setting)

    log_activity(db, current_admin.id, "Update Settings", "Setting", setting.id, "Updated store settings")
    return setting

@router.post("/upload-asset")
async def upload_setting_asset(
    asset_type: str,
    file: UploadFile = File(...),
    current_admin: Admin = Depends(get_current_admin)
):
    url = await upload_image(file, folder="settings")
    return {"url": url, "asset_type": asset_type}
