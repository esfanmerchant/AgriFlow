"""Seed the two additional hardcoded admin accounts.

Idempotent: skips any admin whose email is already registered.
Run from the backend directory:

    python seed_admins.py
"""
from sqlalchemy import select

from app.database import SessionLocal
from app.models import User
from app.security import hash_password

ADMINS = [
    {
        "full_name": "Esfan Merchant",
        "email": "esfanmerchant@gmail.com",
        "phone": "03428481382",
        "password": "esfan123",
    },
    {
        "full_name": "Hashir Vohra",
        "email": "hashir@gmail.com",
        "phone": "03458267841",
        "password": "hashir123",
    },
]


def main() -> None:
    db = SessionLocal()
    try:
        for spec in ADMINS:
            existing = db.scalar(select(User).where(User.email == spec["email"]))
            if existing is not None:
                print(f"  --  {spec['email']} already exists, skipping")
                continue
            user = User(
                full_name=spec["full_name"],
                email=spec["email"],
                phone=spec["phone"],
                password_hash=hash_password(spec["password"]),
                role="admin",
                is_approved=True,
            )
            db.add(user)
            print(f"  OK  inserted {spec['email']}")
        db.commit()
        print("Done.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
