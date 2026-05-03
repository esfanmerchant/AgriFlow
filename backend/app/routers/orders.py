from datetime import datetime
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user
from app.models import Order, OrderDetail, Product, Supplier, User
from app.schemas import (
    OrderCreate,
    OrderItemOut,
    OrderOut,
    OrderStatus,
    OrderStatusUpdate,
)

router = APIRouter(prefix="/orders", tags=["orders"])

# Allowed forward transitions. Cancelled is reachable from pending/confirmed only.
_TRANSITIONS: dict[str, set[str]] = {
    "pending":   {"confirmed", "cancelled"},
    "confirmed": {"shipped", "cancelled"},
    "shipped":   {"delivered"},
    "delivered": set(),
    "cancelled": set(),
}


def _to_out(order: Order) -> OrderOut:
    return OrderOut(
        order_id=order.order_id,
        farmer_id=order.farmer_id,
        farmer_name=order.farmer.full_name if order.farmer else "",
        status=order.status,
        total_amount=float(order.total_amount),
        delivery_addr=order.delivery_addr,
        ordered_at=order.ordered_at,
        updated_at=order.updated_at,
        items=[
            OrderItemOut(
                product_id=d.product_id,
                product_name=d.product.name if d.product else "",
                quantity=d.quantity,
                unit_price_snapshot=float(d.unit_price_snapshot),
                line_total=float(d.line_total) if d.line_total is not None else float(d.quantity) * float(d.unit_price_snapshot),
            )
            for d in order.details
        ],
        payment_status=order.payment.status if order.payment else None,
    )


def _load(db: Session, order_id: int) -> Order | None:
    stmt = (
        select(Order)
        .options(
            joinedload(Order.farmer),
            joinedload(Order.details).joinedload(OrderDetail.product),
            joinedload(Order.payment),
        )
        .where(Order.order_id == order_id)
    )
    return db.scalars(stmt).unique().one_or_none()


def _scope_query(db: Session, user: User):
    """Return a base SELECT scoped to what `user` is allowed to see."""
    base = select(Order).options(
        joinedload(Order.farmer),
        joinedload(Order.details).joinedload(OrderDetail.product),
        joinedload(Order.payment),
    )
    if user.role == "admin":
        return base
    if user.role == "farmer":
        return base.where(Order.farmer_id == user.user_id)
    if user.role == "supplier":
        supplier = db.scalar(select(Supplier).where(Supplier.user_id == user.user_id))
        if supplier is None:
            # No profile → see nothing, but no error so the page still loads.
            return base.where(Order.order_id == -1)
        # Orders that include at least one product from this supplier.
        sub = (
            select(OrderDetail.order_id)
            .join(Product, OrderDetail.product_id == Product.product_id)
            .where(Product.supplier_id == supplier.supplier_id)
        )
        return base.where(Order.order_id.in_(sub))
    return base.where(Order.order_id == -1)


@router.get("", response_model=list[OrderOut])
def list_orders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status_filter: OrderStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=100, ge=1, le=500),
) -> list[OrderOut]:
    stmt = _scope_query(db, current_user).order_by(Order.ordered_at.desc()).limit(limit)
    if status_filter is not None:
        stmt = stmt.where(Order.status == status_filter)
    return [_to_out(o) for o in db.scalars(stmt).unique().all()]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    order = _load(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")
    if not _can_view(db, current_user, order):
        raise HTTPException(status_code=403, detail="Not allowed")
    return _to_out(order)


def _can_view(db: Session, user: User, order: Order) -> bool:
    if user.role == "admin":
        return True
    if user.role == "farmer":
        return order.farmer_id == user.user_id
    if user.role == "supplier":
        supplier = db.scalar(select(Supplier).where(Supplier.user_id == user.user_id))
        if supplier is None:
            return False
        return any(
            d.product is not None and d.product.supplier_id == supplier.supplier_id
            for d in order.details
        )
    return False


@router.post("", response_model=list[OrderOut], status_code=status.HTTP_201_CREATED)
def place_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[OrderOut]:
    """Cart items may span multiple suppliers, so we split the basket into one
    Order per supplier — each supplier gets its own order in their dashboard
    and can confirm/ship/cancel independently."""
    if current_user.role != "farmer":
        raise HTTPException(status_code=403, detail="Only farmers can place orders")

    # Aggregate duplicate product_ids (so the same product on two cart lines
    # doesn't underrun the inventory check)
    wanted: dict[int, int] = {}
    for item in payload.items:
        wanted[item.product_id] = wanted.get(item.product_id, 0) + item.quantity

    products = {
        p.product_id: p
        for p in db.scalars(
            select(Product)
            .options(joinedload(Product.inventory))
            .where(Product.product_id.in_(wanted.keys()))
        ).unique().all()
    }

    # Validate everything up front so we don't half-place a multi-supplier basket.
    by_supplier: dict[int, list[tuple[Product, int]]] = {}
    for pid, qty in wanted.items():
        prod = products.get(pid)
        if prod is None or not prod.is_active:
            raise HTTPException(status_code=400, detail=f"Product {pid} unavailable")
        inv = prod.inventory
        if inv is None or inv.quantity < qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {prod.name}",
            )
        by_supplier.setdefault(prod.supplier_id, []).append((prod, qty))

    created_ids: list[int] = []
    for _supplier_id, lines in by_supplier.items():
        order = Order(
            farmer_id=current_user.user_id,
            delivery_addr=payload.delivery_addr,
            status="pending",
            total_amount=Decimal("0.00"),
        )
        db.add(order)
        db.flush()

        total = Decimal("0.00")
        for prod, qty in lines:
            prod.inventory.quantity -= qty
            db.add(OrderDetail(
                order_id=order.order_id,
                product_id=prod.product_id,
                quantity=qty,
                unit_price_snapshot=prod.unit_price,
            ))
            total += Decimal(prod.unit_price) * qty

        order.total_amount = total
        created_ids.append(order.order_id)

    db.commit()

    return [_to_out(_load(db, oid)) for oid in created_ids]


@router.patch("/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrderOut:
    order = _load(db, order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Permissions: farmer can only cancel their own pending orders.
    # Supplier (whose product is in the order) and admin can advance status.
    if current_user.role == "farmer":
        if order.farmer_id != current_user.user_id:
            raise HTTPException(status_code=403, detail="Not your order")
        if not (order.status == "pending" and payload.status == "cancelled"):
            raise HTTPException(status_code=403, detail="Farmers can only cancel pending orders")
    elif current_user.role == "supplier":
        if not _can_view(db, current_user, order):
            raise HTTPException(status_code=403, detail="Not your order")
    elif current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    if payload.status not in _TRANSITIONS.get(order.status, set()) and payload.status != order.status:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot transition from {order.status} to {payload.status}",
        )

    # If cancelling, restore stock for each line.
    if payload.status == "cancelled" and order.status != "cancelled":
        for line in order.details:
            if line.product and line.product.inventory:
                line.product.inventory.quantity += line.quantity

    order.status = payload.status
    order.updated_at = datetime.utcnow()
    db.commit()

    return _to_out(_load(db, order_id))
