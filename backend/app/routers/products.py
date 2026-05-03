from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import get_current_user, require_role
from app.models import Category, Inventory, Product, Supplier, User
from app.schemas import ProductCreate, ProductOut, ProductUpdate

router = APIRouter(prefix="/products", tags=["products"])


def _to_out(p: Product) -> ProductOut:
    inv = p.inventory
    return ProductOut(
        product_id=p.product_id,
        name=p.name,
        description=p.description,
        unit_price=float(p.unit_price),
        unit=p.unit,
        image_url=p.image_url,
        is_active=p.is_active,
        created_at=p.created_at,
        category_id=p.category_id,
        category_name=p.category.name if p.category else None,
        supplier_id=p.supplier_id,
        supplier_name=p.supplier.company_name if p.supplier else None,
        quantity=inv.quantity if inv else 0,
        reorder_level=inv.reorder_level if inv else 0,
    )


def _load_with_relations(db: Session, product_id: int) -> Product | None:
    stmt = (
        select(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.supplier),
            joinedload(Product.inventory),
        )
        .where(Product.product_id == product_id)
    )
    return db.scalar(stmt)


def _supplier_for(db: Session, user: User) -> Supplier:
    supplier = db.scalar(select(Supplier).where(Supplier.user_id == user.user_id))
    if supplier is None:
        raise HTTPException(
            status_code=400,
            detail="Complete your supplier profile first (POST /suppliers).",
        )
    return supplier


@router.get("", response_model=list[ProductOut])
def list_products(
    db: Session = Depends(get_db),
    category_id: int | None = Query(default=None),
    supplier_id: int | None = Query(default=None),
    search: str | None = Query(default=None, min_length=1, max_length=120),
    include_inactive: bool = Query(default=False),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[ProductOut]:
    stmt = (
        select(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.supplier),
            joinedload(Product.inventory),
        )
        .order_by(Product.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    if not include_inactive:
        stmt = stmt.where(Product.is_active.is_(True))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
    if supplier_id is not None:
        stmt = stmt.where(Product.supplier_id == supplier_id)
    if search:
        like = f"%{search}%"
        stmt = stmt.where(or_(Product.name.ilike(like), Product.description.ilike(like)))

    rows = db.scalars(stmt).unique().all()
    return [_to_out(p) for p in rows]


@router.get("/mine", response_model=list[ProductOut])
def list_my_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
    include_inactive: bool = Query(default=True),
) -> list[ProductOut]:
    supplier = _supplier_for(db, current_user)
    stmt = (
        select(Product)
        .options(
            joinedload(Product.category),
            joinedload(Product.supplier),
            joinedload(Product.inventory),
        )
        .where(Product.supplier_id == supplier.supplier_id)
        .order_by(Product.created_at.desc())
    )
    if not include_inactive:
        stmt = stmt.where(Product.is_active.is_(True))
    return [_to_out(p) for p in db.scalars(stmt).unique().all()]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductOut:
    p = _load_with_relations(db, product_id)
    if p is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return _to_out(p)


@router.post("", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
) -> ProductOut:
    if not current_user.is_approved:
        raise HTTPException(status_code=403, detail="Verification/Approval Pending")

    supplier = _supplier_for(db, current_user)

    if db.get(Category, payload.category_id) is None:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    product = Product(
        supplier_id=supplier.supplier_id,
        category_id=payload.category_id,
        name=payload.name,
        description=payload.description,
        unit_price=payload.unit_price,
        unit=payload.unit,
        image_url=payload.image_url,
    )
    db.add(product)
    db.flush()  # get product_id without committing yet

    inventory = Inventory(
        product_id=product.product_id,
        quantity=payload.initial_quantity,
        reorder_level=payload.reorder_level,
    )
    db.add(inventory)
    db.commit()

    fresh = _load_with_relations(db, product.product_id)
    return _to_out(fresh)


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
) -> ProductOut:
    supplier = _supplier_for(db, current_user)
    product = _load_with_relations(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.supplier_id != supplier.supplier_id:
        raise HTTPException(status_code=403, detail="Not your product")

    data = payload.model_dump(exclude_unset=True)

    if "category_id" in data and db.get(Category, data["category_id"]) is None:
        raise HTTPException(status_code=400, detail="Invalid category_id")

    quantity = data.pop("quantity", None)
    for field, value in data.items():
        setattr(product, field, value)

    if quantity is not None:
        if product.inventory is None:
            db.add(Inventory(product_id=product.product_id, quantity=quantity))
        else:
            product.inventory.quantity = quantity

    db.commit()
    fresh = _load_with_relations(db, product_id)
    return _to_out(fresh)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier")),
) -> None:
    """Soft-delete: marks product inactive. Hard-delete is unsafe because
    Order_Details references products with ON DELETE RESTRICT — past orders
    would block the delete and we'd lose order history if it succeeded."""
    supplier = _supplier_for(db, current_user)
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.supplier_id != supplier.supplier_id:
        raise HTTPException(status_code=403, detail="Not your product")

    product.is_active = False
    db.commit()
