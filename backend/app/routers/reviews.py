from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.deps import require_role
from app.models import Product, Review, User
from app.schemas import ReviewCreate, ReviewOut

router = APIRouter(tags=["reviews"])


def _to_out(r: Review) -> ReviewOut:
    return ReviewOut(
        review_id=r.review_id,
        product_id=r.product_id,
        farmer_id=r.farmer_id,
        farmer_name=r.farmer.full_name if r.farmer else "",
        rating=r.rating,
        comment=r.comment,
        created_at=r.created_at,
    )


@router.post("/reviews", response_model=ReviewOut, status_code=status.HTTP_201_CREATED)
def create_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("farmer")),
) -> ReviewOut:
    if db.get(Product, payload.product_id) is None:
        raise HTTPException(status_code=400, detail="Invalid product_id")

    review = Review(
        farmer_id=current_user.user_id,
        product_id=payload.product_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You already reviewed this product") from None
    db.refresh(review)
    review.farmer = current_user
    return _to_out(review)


@router.get("/products/{product_id}/reviews", response_model=list[ReviewOut])
def list_product_reviews(product_id: int, db: Session = Depends(get_db)) -> list[ReviewOut]:
    stmt = (
        select(Review)
        .options(joinedload(Review.farmer))
        .where(Review.product_id == product_id)
        .order_by(Review.created_at.desc())
    )
    return [_to_out(r) for r in db.scalars(stmt).unique().all()]
