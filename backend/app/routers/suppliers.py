from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models import Supplier, User
from app.schemas import SupplierCreate, SupplierOut, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("", response_model=SupplierOut, status_code=status.HTTP_201_CREATED)
def create_my_supplier_profile(
    payload: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
) -> Supplier:
    existing = db.scalar(select(Supplier).where(Supplier.user_id == current_user.user_id))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Supplier profile already exists")

    supplier = Supplier(
        user_id=current_user.user_id,
        company_name=payload.company_name,
        gst_number=payload.gst_number,
        address=payload.address,
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("/me", response_model=SupplierOut)
def get_my_supplier_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
) -> Supplier:
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.user_id))
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier profile not found")
    return supplier


@router.patch("/me", response_model=SupplierOut)
def update_my_supplier_profile(
    payload: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
) -> Supplier:
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == current_user.user_id))
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(supplier, field, value)

    db.commit()
    db.refresh(supplier)
    return supplier


@router.get("", response_model=list[SupplierOut])
def list_suppliers(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
) -> list[Supplier]:
    return list(db.scalars(select(Supplier).order_by(Supplier.company_name)).all())
