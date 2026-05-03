from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_role
from app.models import Order, Payment, Product, User
from app.schemas import (
    AdminStats,
    AdminUserCreate,
    AdminUserUpdate,
    Role,
    UserOut,
)
from app.security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserOut])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
    role: Role | None = Query(default=None),
) -> list[User]:
    stmt = select(User).order_by(User.created_at.desc())
    if role is not None:
        stmt = stmt.where(User.role == role)
    return list(db.scalars(stmt).all())


@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminUserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    if db.scalar(select(User).where(User.email == payload.email)) is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}", response_model=UserOut)
def update_user(
    user_id: int,
    payload: AdminUserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    data = payload.model_dump(exclude_unset=True)
    if "email" in data:
        clash = db.scalar(
            select(User).where(User.email == data["email"], User.user_id != user_id)
        )
        if clash is not None:
            raise HTTPException(status_code=409, detail="Email already in use")

    for k, v in data.items():
        setattr(user, k, v)

    db.commit()
    db.refresh(user)
    return user


@router.post("/users/{user_id}/approve", response_model=UserOut)
def approve_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> User:
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role != "supplier":
        raise HTTPException(status_code=400, detail="Only supplier accounts require approval")
    user.is_approved = True
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role("admin")),
) -> None:
    if user_id == current_admin.user_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")

    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        db.delete(user)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete this user — they have related records (orders) "
                "that would be orphaned. Cancel/transfer those first."
            ),
        )


@router.get("/stats", response_model=AdminStats)
def stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> AdminStats:
    total_users = db.scalar(select(func.count()).select_from(User)) or 0
    farmers = db.scalar(select(func.count()).select_from(User).where(User.role == "farmer")) or 0
    suppliers = db.scalar(select(func.count()).select_from(User).where(User.role == "supplier")) or 0
    admins = db.scalar(select(func.count()).select_from(User).where(User.role == "admin")) or 0
    total_products = db.scalar(select(func.count()).select_from(Product)) or 0
    total_orders = db.scalar(select(func.count()).select_from(Order)) or 0
    gmv = db.scalar(
        select(func.coalesce(func.sum(Order.total_amount), Decimal("0")))
        .where(Order.status != "cancelled")
    ) or Decimal("0")
    failed_payments = db.scalar(
        select(func.count()).select_from(Payment).where(Payment.status == "failed")
    ) or 0

    return AdminStats(
        total_users=total_users,
        farmers=farmers,
        suppliers=suppliers,
        admins=admins,
        total_products=total_products,
        total_orders=total_orders,
        gmv=float(gmv),
        failed_payments=failed_payments,
    )
