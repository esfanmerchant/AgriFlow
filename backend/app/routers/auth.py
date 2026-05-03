from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User
from app.schemas import LoginRequest, SignupRequest, TokenResponse, UserOut
from app.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> TokenResponse:
    if payload.role == "admin":  # defence-in-depth; schema already forbids it
        raise HTTPException(status_code=403, detail="Admin accounts are issued internally")

    existing = db.scalar(select(User).where(User.email == payload.email))
    if existing is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    is_approved = payload.role != "supplier"  # suppliers wait for admin approval

    user = User(
        full_name=payload.full_name,
        email=payload.email,
        password_hash=hash_password(payload.password),
        phone=payload.phone,
        role=payload.role,
        is_approved=is_approved,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if not is_approved:
        # Don't issue a token yet; surface the pending state to the UI.
        raise HTTPException(
            status_code=202,
            detail=(
                "Supplier account created. Verification/Approval Pending — "
                "an admin must approve your account before you can sign in."
            ),
        )

    token = create_access_token(user.user_id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.role == "supplier" and not user.is_approved:
        raise HTTPException(status_code=403, detail="Verification/Approval Pending")

    token = create_access_token(user.user_id)
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))
