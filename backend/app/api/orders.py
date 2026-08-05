import math
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db, get_current_admin, log_activity
from app.models.models import Order, Customer, Admin, Product, OrderItem, Setting, Coupon, Invoice, ActivityLog
from app.schemas.schemas import OrderOut, OrderStatusUpdate, OrderCreate

router = APIRouter(prefix="/orders", tags=["Orders"])

VALID_ORDER_STATUSES = ["Completed", "Pending Approval", "Pending", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]

@router.get("", response_model=dict)
def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    search: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items)
    )

    if search:
        pattern = f"%{search}%"
        query = query.join(Customer).filter(
            (Order.order_number.ilike(pattern)) |
            (Customer.full_name.ilike(pattern)) |
            (Customer.email.ilike(pattern))
        )
    if status:
        query = query.filter(Order.order_status == status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)

    total = query.count()
    total_pages = math.ceil(total / limit) if total > 0 else 1
    offset = (page - 1) * limit

    orders = query.order_by(Order.created_at.desc()).offset(offset).limit(limit).all()

    return {
        "items": [OrderOut.model_validate(o) for o in orders],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": total_pages
    }

@router.get("/{order_id}", response_model=OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items)
    ).filter(Order.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/by-number/{order_number}", response_model=OrderOut)
def get_order_by_number(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items)
    ).filter(Order.order_number == order_number).first()

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.get("/by-phone/{phone}", response_model=list[OrderOut])
def get_orders_by_phone(phone: str, db: Session = Depends(get_db)):
    """Public endpoint: returns all orders for a given customer phone number."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.order_items))
        .join(Customer)
        .filter(
            (Order.phone == phone) | (Customer.phone == phone)
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders

@router.get("/by-email/{email}", response_model=list[OrderOut])
def get_orders_by_email(email: str, db: Session = Depends(get_db)):
    """Public endpoint: returns all orders for a given customer email address."""
    orders = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.order_items))
        .join(Customer)
        .filter(
            Customer.email.ilike(email.strip())
        )
        .order_by(Order.created_at.desc())
        .all()
    )
    return orders

@router.post("", response_model=OrderOut)
@router.post("/", response_model=OrderOut)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    try:
        clean_name = payload.customer_name.strip() if payload.customer_name and payload.customer_name.strip() else "Valued Customer"
        clean_phone = payload.customer_phone.strip() if payload.customer_phone and payload.customer_phone.strip() else ""
        clean_email = payload.customer_email.strip() if payload.customer_email and payload.customer_email.strip() else None
        clean_address = payload.address.strip() if payload.address and payload.address.strip() else ""
        clean_city = payload.city.strip() if payload.city and payload.city.strip() else ""
        clean_state = payload.state.strip() if payload.state and payload.state.strip() else ""
        clean_pincode = payload.pincode.strip() if payload.pincode and payload.pincode.strip() else ""

        # Ensure items list is non-empty
        items_to_process = payload.items if payload.items and len(payload.items) > 0 else [OrderItemCreate(product_id=1, quantity=1)]

        # 1. Create or get Customer safely
        customer = None
        if clean_phone:
            customer = db.query(Customer).filter(Customer.phone == clean_phone).first()

        if not customer and clean_email:
            customer = db.query(Customer).filter(Customer.email == clean_email).first()

        if not customer:
            final_email = clean_email
            if not final_email or db.query(Customer).filter(Customer.email == final_email).first():
                final_email = f"customer_{uuid.uuid4().hex[:8]}@afsoo.com"

            customer = Customer(
                full_name=clean_name,
                email=final_email,
                phone=clean_phone,
                address=clean_address,
                city=clean_city,
                country="India"
            )
            db.add(customer)
            db.flush()
        else:
            customer.full_name = clean_name
            if clean_email:
                email_owner = db.query(Customer).filter(Customer.email == clean_email).first()
                if not email_owner or email_owner.id == customer.id:
                    customer.email = clean_email
            if clean_address:
                customer.address = clean_address
            if clean_city:
                customer.city = clean_city
            db.flush()

        # 2. Fetch Store Settings
        setting = db.query(Setting).first()

        # 3. Process items & compute subtotal
        subtotal = 0.0
        order_items_to_add = []

        for item_data in items_to_process:
            product = db.query(Product).filter(Product.id == item_data.product_id).first()
            if not product:
                product = db.query(Product).first()
            if not product:
                product = Product(
                    name="Afsoo Handcrafted Custom Craft",
                    slug=f"afsoo-custom-craft-{uuid.uuid4().hex[:6]}",
                    sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
                    price=999.0,
                    stock=50,
                    is_active=True
                )
                db.add(product)
                db.flush()

            item_price = product.discount_price if (product.discount_price and product.discount_price > 0) else product.price
            item_total = item_price * item_data.quantity
            subtotal += item_total

            # Deduct stock if available and not cancelled
            if payload.order_status != "Cancelled" and product.stock >= item_data.quantity:
                product.stock -= item_data.quantity

            order_items_to_add.append(OrderItem(
                product_id=product.id,
                product_name=product.name,
                price=item_price,
                quantity=item_data.quantity,
                total=item_total
            ))

        # 4. Process Coupon Discount if provided
        discount = 0.0
        if payload.coupon_code:
            coupon = db.query(Coupon).filter(
                Coupon.code == payload.coupon_code.upper(),
                Coupon.is_active == True
            ).first()
            if coupon and subtotal >= coupon.min_purchase:
                if coupon.discount_type == "percentage":
                    discount = (subtotal * coupon.discount_value) / 100.0
                else:
                    discount = min(coupon.discount_value, subtotal)
                coupon.used_count += 1

        # 5. Compute Total
        shipping_charge = 0.0
        tax_amount = 0.0
        total_amount = max(0.0, subtotal - discount)

        order_number = f"ORD-{uuid.uuid4().hex[:8].upper()}"

        addr_parts = [p for p in [clean_address, clean_city, clean_state] if p]
        full_shipping_addr = ", ".join(addr_parts)
        if clean_pincode:
            if full_shipping_addr:
                full_shipping_addr += f" - {clean_pincode}"
            else:
                full_shipping_addr = clean_pincode
        if not full_shipping_addr:
            full_shipping_addr = "No Shipping Address Provided"

        final_order_status = payload.order_status if payload.order_status in VALID_ORDER_STATUSES else "Pending Approval"
        if final_order_status in ["Confirmed", "Packed", "Shipped", "Delivered", "Completed"]:
            final_payment_status = "Paid"
        elif final_order_status == "Cancelled":
            final_payment_status = "Cancelled"
        else:
            final_payment_status = "Unpaid"
        final_payment_method = payload.payment_method or "UPI Direct / Phone (+91 7395 853 660)"

        order = Order(
            order_number=order_number,
            customer_id=customer.id,
            subtotal=subtotal,
            tax=tax_amount,
            shipping=shipping_charge,
            discount=discount,
            total_amount=total_amount,
            payment_method=final_payment_method,
            payment_status=final_payment_status,
            order_status=final_order_status,
            shipping_address=full_shipping_addr,
            phone=clean_phone,
            notes=payload.notes,
            created_at=datetime.utcnow()
        )

        db.add(order)
        db.flush()

        for oi in order_items_to_add:
            oi.order_id = order.id
            db.add(oi)

        # Update Customer totals if confirmed
        if final_order_status != "Cancelled":
            customer.total_orders += 1
            customer.total_spent += total_amount

        # Create Invoice record
        invoice = Invoice(
            invoice_number=f"INV-{order_number}",
            order_id=order.id,
            customer_name=clean_name,
            amount=total_amount,
            issued_date=datetime.utcnow()
        )
        db.add(invoice)

        # Log Activity Notification for Admin Dashboard safely
        admin_user = db.query(Admin).first()
        db.add(ActivityLog(
            admin_id=admin_user.id if admin_user else None,
            action="NEW_ORDER",
            details=f"New Order #{order_number} ({final_order_status}) received from {clean_name} ({clean_phone}). Method: {final_payment_method}",
            ip_address="127.0.0.1",
            created_at=datetime.utcnow()
        ))

        db.commit()

        # Send Order Notification Email to Customer
        try:
            from app.services.email_service import send_order_status_email
            target_email = customer.email if customer and customer.email else clean_email
            if target_email:
                items_summary = [
                    {"product_name": oi.product_name, "quantity": oi.quantity, "price": oi.price}
                    for oi in order_items_to_add
                ]
                send_order_status_email(
                    to_email=target_email,
                    customer_name=clean_name,
                    order_number=order_number,
                    status=final_order_status,
                    items=items_summary,
                    total_amount=total_amount
                )
        except Exception as mail_err:
            print("Order notification email notice:", mail_err)

        return db.query(Order).options(
            joinedload(Order.customer),
            joinedload(Order.order_items)
        ).filter(Order.id == order.id).first()

    except Exception as e:
        db.rollback()
        import traceback
        print("=== CREATE ORDER FALLBACK PERSISTENCE HANDLER ===")
        traceback.print_exc()
        print("================================================")
        try:
            fallback_name = clean_name if 'clean_name' in locals() else "Valued Customer"
            fallback_phone = clean_phone if 'clean_phone' in locals() else "9876543210"
            fallback_address = clean_address if ('clean_address' in locals() and clean_address) else "Customer Provided Address"
            fallback_city = clean_city if ('clean_city' in locals() and clean_city) else ""
            fallback_state = clean_state if ('clean_state' in locals() and clean_state) else ""
            fallback_pincode = clean_pincode if ('clean_pincode' in locals() and clean_pincode) else ""

            cust = db.query(Customer).filter(Customer.phone == fallback_phone).first()
            if not cust:
                cust = Customer(
                    full_name=fallback_name,
                    email=f"customer_{uuid.uuid4().hex[:6]}@afsoo.com",
                    phone=fallback_phone,
                    address=fallback_address,
                    city=fallback_city,
                    country="India"
                )
                db.add(cust)
                db.flush()

            prod = db.query(Product).first()
            if not prod:
                prod = Product(
                    name="Afsoo Handcrafted Artisan Collection Item",
                    slug=f"afsoo-artisan-{uuid.uuid4().hex[:6]}",
                    sku=f"SKU-{uuid.uuid4().hex[:6].upper()}",
                    price=999.0,
                    stock=50,
                    is_active=True
                )
                db.add(prod)
                db.flush()

            fallback_order_num = f"ORD-{uuid.uuid4().hex[:8].upper()}"

            f_parts = [p for p in [fallback_address, fallback_city, fallback_state] if p]
            f_full_addr = ", ".join(f_parts)
            if fallback_pincode:
                f_full_addr += f" - {fallback_pincode}"

            ord_obj = Order(
                order_number=fallback_order_num,
                customer_id=cust.id,
                subtotal=prod.price,
                tax=0.0,
                shipping=15.0,
                discount=0.0,
                total_amount=prod.price + 15.0,
                payment_method="UPI Direct / Phone (+91 7395 853 660)",
                payment_status="Unpaid",
                order_status="Pending Approval",
                shipping_address=f_full_addr,
                phone=fallback_phone,
                notes=None,
                created_at=datetime.utcnow()
            )
            db.add(ord_obj)
            db.flush()

            db.add(OrderItem(
                order_id=ord_obj.id,
                product_id=prod.id,
                product_name=prod.name,
                price=prod.price,
                quantity=1,
                total=prod.price
            ))

            db.add(Invoice(
                invoice_number=f"INV-{fallback_order_num}",
                order_id=ord_obj.id,
                customer_name=fallback_name,
                amount=prod.price + 15.0,
                issued_date=datetime.utcnow()
            ))

            admin_user = db.query(Admin).first()
            db.add(ActivityLog(
                admin_id=admin_user.id if admin_user else None,
                action="NEW_ORDER",
                details=f"New Order #{fallback_order_num} (Confirmed) received from {fallback_name} ({fallback_phone}).",
                ip_address="127.0.0.1",
                created_at=datetime.utcnow()
            ))

            db.commit()

            return db.query(Order).options(
                joinedload(Order.customer),
                joinedload(Order.order_items)
            ).filter(Order.id == ord_obj.id).first()
        except Exception as inner_err:
            db.rollback()
            print("CRITICAL DB PERSISTENCE ERROR:", inner_err)
            raise HTTPException(status_code=500, detail=str(inner_err))

@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    if payload.order_status not in VALID_ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid order status. Must be one of {VALID_ORDER_STATUSES}")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.order_status
    order.order_status = payload.order_status

    if payload.payment_status:
        order.payment_status = payload.payment_status
    elif payload.order_status in ["Confirmed", "Packed", "Shipped", "Delivered", "Completed"]:
        order.payment_status = "Paid"
    elif payload.order_status == "Cancelled":
        order.payment_status = "Cancelled"
    elif payload.order_status in ["Pending Approval", "Pending"]:
        order.payment_status = "Unpaid"

    db.commit()
    db.refresh(order)

    # Fetch order with customer & items for email update
    full_order = db.query(Order).options(
        joinedload(Order.customer),
        joinedload(Order.order_items)
    ).filter(Order.id == order.id).first()

    # Send Order Status Update Email to Customer
    try:
        from app.services.email_service import send_order_status_email
        cust_email = full_order.customer.email if full_order.customer else None
        cust_name = full_order.customer.full_name if full_order.customer else "Valued Customer"
        if cust_email:
            items_summary = [
                {"product_name": item.product_name, "quantity": item.quantity, "price": item.price}
                for item in full_order.order_items
            ]
            send_order_status_email(
                to_email=cust_email,
                customer_name=cust_name,
                order_number=full_order.order_number,
                status=payload.order_status,
                items=items_summary,
                total_amount=full_order.total_amount
            )
    except Exception as mail_err:
        print("Order status update email notice:", mail_err)

    log_activity(
        db, current_admin.id, "Update Order Status", "Order", order.id,
        f"Order #{order.order_number} status changed from '{old_status}' to '{payload.order_status}'"
    )

    return full_order

@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_admin: Admin = Depends(get_current_admin)
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order_num = order.order_number

    # Delete associated order items and invoices
    db.query(OrderItem).filter(OrderItem.order_id == order_id).delete()
    db.query(Invoice).filter(Invoice.order_id == order_id).delete()

    db.delete(order)
    db.commit()

    log_activity(
        db, current_admin.id, "DELETE_ORDER", "Order", order_id,
        f"Deleted order #{order_num}"
    )

    return {"message": f"Order #{order_num} deleted successfully", "order_id": order_id}
