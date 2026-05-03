from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models import Order, Payment, User
from app.schemas import PaymentCreate, PaymentOut

router = APIRouter(prefix="/payments", tags=["payments"])


@router.post("", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: PaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Payment:
    order = db.get(Order, payload.order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    if current_user.role != "admin" and order.farmer_id != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not your order")

    if db.scalar(select(Payment).where(Payment.order_id == payload.order_id)) is not None:
        raise HTTPException(status_code=409, detail="Payment already exists for this order")

    # Demo: payment is auto-completed on creation. Real flow would call a gateway,
    # store reference_no, and flip status via webhook.
    payment = Payment(
        order_id=payload.order_id,
        method=payload.method,
        amount=payload.amount,
        status="completed",
        paid_at=datetime.utcnow(),
        reference_no=payload.reference_no,
    )
    db.add(payment)

    if order.status == "pending":
        order.status = "confirmed"

    db.commit()
    db.refresh(payment)
    return payment


@router.get("", response_model=list[PaymentOut])
def list_payments(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> list[Payment]:
    return list(db.scalars(select(Payment).order_by(Payment.payment_id.desc())).all())
