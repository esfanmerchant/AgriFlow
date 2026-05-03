from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_role
from app.models import Category, Product, User
from app.schemas import CategoryCreate, CategoryOut, CategoryUpdate

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)) -> list[Category]:
    return list(db.scalars(select(Category).order_by(Category.name)).all())


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Category:
    if db.scalar(select(Category).where(Category.name == payload.name)) is not None:
        raise HTTPException(status_code=409, detail="A category with this name already exists")

    if payload.parent_id is not None and db.get(Category, payload.parent_id) is None:
        raise HTTPException(status_code=400, detail="Invalid parent_id")

    category = Category(name=payload.name, parent_id=payload.parent_id)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> Category:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] != category.name:
        clash = db.scalar(
            select(Category).where(Category.name == data["name"], Category.category_id != category_id)
        )
        if clash is not None:
            raise HTTPException(status_code=409, detail="A category with this name already exists")

    if "parent_id" in data and data["parent_id"] is not None:
        if data["parent_id"] == category_id:
            raise HTTPException(status_code=400, detail="A category cannot be its own parent")
        if db.get(Category, data["parent_id"]) is None:
            raise HTTPException(status_code=400, detail="Invalid parent_id")

    for k, v in data.items():
        setattr(category, k, v)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
) -> None:
    category = db.get(Category, category_id)
    if category is None:
        raise HTTPException(status_code=404, detail="Category not found")

    in_use = db.scalar(
        select(func.count()).select_from(Product).where(Product.category_id == category_id)
    ) or 0
    if in_use > 0:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete: {in_use} product(s) still reference this category. Reassign them first.",
        )

    try:
        db.delete(category)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Category is referenced by other records")
