import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload
from app.api.deps import get_db
from app.models.models import Product, Order, Customer, Category, OrderItem
from app.schemas.schemas import AnalyticsSummary, ProductOut, OrderOut, CustomerOut
from app.services.export_service import generate_csv_report, generate_excel_report

router = APIRouter(prefix="/sales", tags=["Sales & Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(db: Session = Depends(get_db)):
    today = datetime.date.today()
    start_of_today = datetime.datetime.combine(today, datetime.time.min)
    start_of_month = datetime.datetime(today.year, today.month, 1)

    total_products = db.query(Product).count()
    total_orders = db.query(Order).count()
    total_customers = db.query(Customer).count()

    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == "Paid",
        Order.order_status != "Cancelled"
    ).scalar() or 0.0
    
    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == "Paid",
        Order.order_status != "Cancelled",
        Order.created_at >= start_of_today
    ).scalar() or 0.0

    monthly_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.payment_status == "Paid",
        Order.order_status != "Cancelled",
        Order.created_at >= start_of_month
    ).scalar() or 0.0

    pending_orders = db.query(Order).filter(Order.order_status.in_(["Pending", "Pending Approval"])).count()
    completed_orders = db.query(Order).filter(Order.order_status.in_(["Completed", "Confirmed", "Packed", "Shipped", "Delivered"])).count()
    cancelled_orders = db.query(Order).filter(Order.order_status == "Cancelled").count()

    low_stock_products = db.query(Product).filter(Product.stock <= 5).count()

    return AnalyticsSummary(
        total_products=total_products,
        total_orders=total_orders,
        total_customers=total_customers,
        total_revenue=round(total_revenue, 2),
        today_revenue=round(today_revenue, 2),
        monthly_revenue=round(monthly_revenue, 2),
        pending_orders=pending_orders,
        completed_orders=completed_orders,
        cancelled_orders=cancelled_orders,
        low_stock_products=low_stock_products
    )

@router.get("/charts")
def get_analytics_charts(db: Session = Depends(get_db)):
    # 1. Revenue & Order trend for past 7 days
    today = datetime.date.today()
    daily_stats = []
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_start = datetime.datetime.combine(day, datetime.time.min)
        day_end = datetime.datetime.combine(day, datetime.time.max)

        rev = db.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == "Paid",
            Order.order_status != "Cancelled",
            Order.created_at >= day_start,
            Order.created_at <= day_end
        ).scalar() or 0.0

        ord_cnt = db.query(Order).filter(
            Order.created_at >= day_start,
            Order.created_at <= day_end
        ).count()

        daily_stats.append({
            "day": day.strftime("%a %b %d"),
            "revenue": round(rev, 2),
            "orders": ord_cnt
        })

    # 2. Monthly Revenue for current year (Jan-Dec)
    current_year = today.year
    monthly_stats = []
    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for m in range(1, 13):
        rev = db.query(func.sum(Order.total_amount)).filter(
            Order.payment_status == "Paid",
            Order.order_status != "Cancelled",
            func.extract('year', Order.created_at) == current_year,
            func.extract('month', Order.created_at) == m
        ).scalar() or 0.0

        monthly_stats.append({
            "month": month_names[m - 1],
            "revenue": round(rev, 2)
        })

    # 3. Top selling products
    top_products = db.query(
        OrderItem.product_name,
        func.sum(OrderItem.quantity).label("total_sold"),
        func.sum(OrderItem.total).label("total_revenue")
    ).group_by(OrderItem.product_name).order_by(func.sum(OrderItem.quantity).desc()).limit(5).all()

    top_products_data = [
        {"name": name, "sold": sold, "revenue": round(rev, 2)}
        for name, sold, rev in top_products
    ]

    # 4. Top selling categories
    top_categories = db.query(
        Category.name,
        func.count(Product.id).label("product_count")
    ).join(Product, Product.category_id == Category.id, isouter=True).group_by(Category.name).all()

    top_categories_data = [
        {"name": name, "value": count}
        for name, count in top_categories
    ]

    return {
        "daily_trend": daily_stats,
        "monthly_trend": monthly_stats,
        "top_products": top_products_data,
        "top_categories": top_categories_data
    }

@router.get("/recent-activity")
def get_recent_activity(db: Session = Depends(get_db)):
    latest_orders = db.query(Order).options(joinedload(Order.customer)).order_by(Order.created_at.desc()).limit(5).all()
    latest_customers = db.query(Customer).order_by(Customer.created_at.desc()).limit(5).all()
    latest_products = db.query(Product).options(joinedload(Product.category)).order_by(Product.created_at.desc()).limit(5).all()

    return {
        "latest_orders": [OrderOut.model_validate(o) for o in latest_orders],
        "latest_customers": [CustomerOut.model_validate(c) for c in latest_customers],
        "latest_products": [ProductOut.model_validate(p) for p in latest_products]
    }

@router.get("/export")
def export_sales_report(
    format: str = Query("csv", regex="^(csv|excel)$"),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).options(joinedload(Order.customer)).order_by(Order.created_at.desc()).all()
    data = []
    for o in orders:
        data.append({
            "Order Number": o.order_number,
            "Customer Name": o.customer.full_name if o.customer else "N/A",
            "Customer Email": o.customer.email if o.customer else "N/A",
            "Date": o.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "Subtotal": o.subtotal,
            "Tax": o.tax,
            "Shipping": o.shipping,
            "Discount": o.discount,
            "Total Amount": o.total_amount,
            "Payment Method": o.payment_method,
            "Payment Status": o.payment_status,
            "Order Status": o.order_status,
        })

    filename = f"sales_report_{datetime.date.today().isoformat()}"
    if format == "csv":
        content = generate_csv_report(data)
        return Response(
            content=content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}.csv"}
        )
    else:
        content = generate_excel_report(data)
        return Response(
            content=content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename={filename}.xlsx"}
        )
