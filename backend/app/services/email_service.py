import os
import smtplib
import threading
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import settings

logger = logging.getLogger("email_service")
logger.setLevel(logging.INFO)

def send_email_async(to_email: str, subject: str, html_content: str):
    """Sends an email in a background thread using SMTP or logs to console if unconfigured."""
    def _worker():
        try:
            if not to_email or "@" not in to_email or "afsoo.com" in to_email and to_email.startswith("customer_"):
                logger.info(f"[EMAIL MOCK] Skipped synthetic/invalid recipient email: {to_email}")
                return

            if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
                logger.info(f"==================================================")
                logger.info(f"[EMAIL NOTIFICATION DISPATCHED]")
                logger.info(f"To: {to_email}")
                logger.info(f"Subject: {subject}")
                logger.info(f"Status: Logged successfully (Set SMTP_USER & SMTP_PASSWORD env vars for live SMTP delivery)")
                logger.info(f"==================================================")
                return

            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
            msg["To"] = to_email

            part = MIMEText(html_content, "html")
            msg.attach(part)

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.sendmail(settings.EMAILS_FROM_EMAIL, [to_email], msg.as_string())

            logger.info(f"Successfully sent live email to {to_email} with subject '{subject}'")
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()

def send_welcome_email(to_email: str, full_name: str):
    """Sends a greeting welcome email to newly registered customers."""
    subject = f"Welcome to Afsoo Crafts Studio, {full_name}! 🎨✨"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }}
        .header {{ text-align: center; padding-bottom: 24px; border-bottom: 1px solid #f1f5f9; }}
        .brand {{ color: #d97706; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }}
        .content {{ padding: 24px 0; line-height: 1.6; font-size: 14px; }}
        .btn {{ display: inline-block; background-color: #f59e0b; color: #ffffff !important; padding: 14px 28px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; margin-top: 16px; text-align: center; }}
        .footer {{ text-align: center; font-size: 12px; color: #94a3b8; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">AFSOO CRAFTS STUDIO</div>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 12px; font-weight: 600;">Authentic Indian Artisanal Crafts</p>
        </div>
        <div class="content">
          <h2 style="color: #0f172a; margin-top: 0;">Warm Welcome, {full_name}! 👋</h2>
          <p>Thank you for creating an account with <strong>Afsoo Crafts Studio</strong>. We are thrilled to have you join our community celebrating authentic Indian handloom textiles, crochet creations, and sustainable artisan products.</p>
          <p>You can now save your delivery addresses, track your order fulfillment live in real-time, and discover unique handcrafted pieces straight from master artisans into your home.</p>
          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:5173/shop" class="btn">Explore Shop Catalog &rarr;</a>
          </div>
          <p style="font-size: 13px; color: #64748b;">If you ever have any questions or custom craft inquiries, reply to this email or call/WhatsApp us directly at <strong>+91 7395 853 660</strong>.</p>
        </div>
        <div class="footer">
          &copy; 2026 Afsoo Crafts Studio. All rights reserved.<br>
          Handcrafted with Love &amp; Passion in India.
        </div>
      </div>
    </body>
    </html>
    """
    send_email_async(to_email, subject, html)

def send_order_status_email(to_email: str, customer_name: str, order_number: str, status: str, items: list, total_amount: float):
    """Sends an email whenever an order is placed or its status is updated by admin."""
    status_label_map = {
        "Pending Approval": "Waiting for Admin Approval ⏳",
        "Pending": "Waiting for Admin Approval ⏳",
        "Confirmed": "Order Confirmed & Approved! ✅",
        "Packed": "Packed & Processing 📦",
        "Shipped": "Out for Delivery 🚚",
        "Delivered": "Delivered to Doorstep 🎉",
        "Cancelled": "Order Cancelled ❌"
    }

    badge_color_map = {
        "Pending Approval": "#d97706",
        "Confirmed": "#2563eb",
        "Packed": "#7c3aed",
        "Shipped": "#0284c7",
        "Delivered": "#059669",
        "Cancelled": "#e11d48"
    }

    status_title = status_label_map.get(status, f"Status: {status}")
    badge_color = badge_color_map.get(status, "#d97706")

    subject = f"Order #{order_number} Update: {status_title}"

    items_html = ""
    for item in items:
        p_name = item.get("product_name") or item.get("name") or "Artisan Product"
        qty = item.get("quantity", 1)
        price = item.get("price", 0.0)
        items_html += f"""
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; font-weight: 600;">{p_name}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: center; color: #64748b;">x{qty}</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 700; font-family: monospace;">₹{price * qty:.2f}</td>
        </tr>
        """

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }}
        .header {{ text-align: center; padding-bottom: 20px; border-bottom: 1px solid #f1f5f9; }}
        .brand {{ color: #d97706; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }}
        .status-badge {{ display: inline-block; background-color: {badge_color}; color: #ffffff; padding: 8px 18px; border-radius: 50px; font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 12px; }}
        .content {{ padding: 24px 0; line-height: 1.6; font-size: 14px; }}
        .items-table {{ width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }}
        .total-box {{ background: #f8fafc; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0; font-weight: 800; display: flex; justify-content: space-between; font-size: 15px; margin-top: 16px; }}
        .btn {{ display: inline-block; background-color: #f59e0b; color: #ffffff !important; padding: 14px 28px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-align: center; }}
        .footer {{ text-align: center; font-size: 12px; color: #94a3b8; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">AFSOO CRAFTS STUDIO</div>
          <div class="status-badge">{status_title}</div>
        </div>
        <div class="content">
          <h3 style="margin-top: 0;">Hello {customer_name},</h3>
          <p>Your Order <strong style="font-family: monospace; font-size: 15px;">#{order_number}</strong> status has been updated to <strong>{status_title}</strong>.</p>
          
          <div style="margin-top: 20px;">
            <h4 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 11px; color: #94a3b8; letter-spacing: 1px;">Purchased Items</h4>
            <table class="items-table">
              {items_html}
            </table>
          </div>

          <div class="total-box">
            <span>Total Amount Paid:</span>
            <span style="color: #d97706; font-family: monospace;">₹{total_amount:.2f}</span>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="http://localhost:5173/my-orders" class="btn">Track Order Live Status &rarr;</a>
          </div>

          <p style="font-size: 13px; color: #64748b;">Thank you for shopping with Afsoo Crafts Studio. Contact support anytime at <strong>+91 7395 853 660</strong>.</p>
        </div>
        <div class="footer">
          &copy; 2026 Afsoo Crafts Studio. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    """
    send_email_async(to_email, subject, html)

def send_new_product_broadcast(recipient_emails: list[str], product_name: str, price: float, image_url: str, description: str):
    """Sends a new product announcement email to all registered customer accounts."""
    if not recipient_emails:
        return

    subject = f"🎉 New Arrival at Afsoo: Discover {product_name}!"

    img_src = image_url if image_url and image_url.startswith("http") else "http://localhost:5173/logo.png"
    desc_clean = description or "Exquisite new handcrafted creation now available in our store!"

    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 20px; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); text-align: center; }}
        .brand {{ color: #d97706; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; text-transform: uppercase; }}
        .product-img {{ width: 100%; max-height: 320px; object-fit: cover; border-radius: 18px; margin: 20px 0; border: 1px solid #e2e8f0; }}
        .price {{ font-size: 24px; font-weight: 900; color: #d97706; font-family: monospace; margin: 8px 0; }}
        .btn {{ display: inline-block; background-color: #f59e0b; color: #ffffff !important; padding: 14px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-align: center; margin-top: 16px; }}
        .footer {{ text-align: center; font-size: 12px; color: #94a3b8; padding-top: 24px; border-top: 1px solid #f1f5f9; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="brand">AFSOO CRAFTS STUDIO</div>
        <p style="color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px;">New Product Announcement</p>
        
        <h2 style="color: #0f172a; margin-top: 16px;">{product_name}</h2>
        <div class="price">₹{price:.2f}</div>
        
        <img src="{img_src}" alt="{product_name}" class="product-img" />
        
        <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: left; background: #f8fafc; padding: 16px; border-radius: 14px; border: 1px solid #f1f5f9;">
          {desc_clean}
        </p>

        <a href="http://localhost:5173/shop" class="btn">View &amp; Buy Product Now &rarr;</a>

        <div class="footer">
          &copy; 2026 Afsoo Crafts Studio. You are receiving this because you are a registered member of Afsoo Crafts Studio.
        </div>
      </div>
    </body>
    </html>
    """

    for email_addr in recipient_emails:
        if email_addr and "@" in email_addr:
            send_email_async(email_addr, subject, html)
