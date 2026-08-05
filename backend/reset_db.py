import os
import shutil
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.models import Admin, Category, Product, Customer, Order, OrderItem, Payment, Invoice, Coupon, Review, Setting, ActivityLog

def reset_and_clean_database():
    print("Resetting database to 100% clean state for AFSOO...")
    
    # Drop all tables and recreate clean schema
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    # Clear local uploads folder if it exists
    uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
    if os.path.exists(uploads_dir):
        for filename in os.listdir(uploads_dir):
            file_path = os.path.join(uploads_dir, filename)
            try:
                if os.path.isfile(file_path) or os.path.islink(file_path):
                    os.unlink(file_path)
                elif os.path.isdir(file_path):
                    shutil.rmtree(file_path)
            except Exception as e:
                print(f"Failed to delete {file_path}: {e}")
        print("[OK] Cleared all stored media and photos in /uploads")

    db: Session = SessionLocal()
    try:
        # Create single Admin Account for Afsoo
        admin = Admin(
            email="afuzee0324@yahoo.com",
            hashed_password=get_password_hash("Aafrinrawoof@20"),
            full_name="Afsoo Administrator",
            role="superadmin",
            avatar_url=None,
            is_active=True
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print("[OK] Created Admin user: afuzee0324@yahoo.com / Aafrinrawoof@20")

        # Create Default Clean Store Settings for Afsoo
        setting = Setting(
            store_name="Afsoo Crafts Studio",
            store_logo="/static/uploads/afsoo_logo.png",
            favicon="/logo.png",
            contact_number="+1 (555) 000-AFSOO",
            email="support@afsoo.com",
            address="Afsoo Design Studio, Main Street",
            whatsapp="+1 (555) 000-AFSOO",
            instagram="https://instagram.com/afsoodesign",
            facebook="https://facebook.com/afsoodesign",
            shipping_charge=0.0,
            tax_percentage=0.0,
            currency="INR",
            upi_qr_code="/upi_qr.png",
            upi_id="zeeshan240896@oksbi",
            store_banner=None,
            maintenance_mode=False
        )
        db.add(setting)
        db.commit()
        print("[OK] Created Afsoo Store Settings")

        # Initial clean activity log
        log = ActivityLog(
            admin_id=admin.id,
            action="System Database Reset",
            entity_type="Database",
            details="All sample data and photos purged. Clean Afsoo configuration initialized."
        )
        db.add(log)
        db.commit()

        print("\nSUCCESS: DATABASE PURGED! 0 products, 0 categories, 0 orders, 0 customers, 0 coupons, 0 reviews.")
        print("Ready for clean input under company name 'AFSOO'.")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Reset failed: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_clean_database()
