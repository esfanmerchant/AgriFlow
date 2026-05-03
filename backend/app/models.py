from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Computed,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    SmallInteger,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.dialects.postgresql import ENUM as PgEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

# These ENUM types already exist in the DB (created by schema.postgres.sql).
# create_type=False prevents SQLAlchemy from trying to CREATE TYPE again.
user_role_enum = PgEnum(
    "farmer", "supplier", "admin", name="user_role", create_type=False
)
order_status_enum = PgEnum(
    "pending", "confirmed", "shipped", "delivered", "cancelled",
    name="order_status", create_type=False,
)
payment_method_enum = PgEnum(
    "cash", "bank_transfer", "mobile_wallet", "card",
    name="payment_method", create_type=False,
)
payment_status_enum = PgEnum(
    "pending", "completed", "failed", "refunded",
    name="payment_status", create_type=False,
)


class User(Base):
    __tablename__ = "users"

    user_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(180), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(256), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20))
    role: Mapped[str] = mapped_column(user_role_enum, nullable=False, default="farmer")
    is_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    supplier: Mapped["Supplier | None"] = relationship(
        back_populates="user", uselist=False, passive_deletes=True
    )
    orders: Mapped[list["Order"]] = relationship(
        back_populates="farmer", passive_deletes=True
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="farmer", passive_deletes=True
    )


class Supplier(Base):
    __tablename__ = "suppliers"

    supplier_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False, unique=True
    )
    company_name: Mapped[str] = mapped_column(String(160), nullable=False)
    gst_number: Mapped[str | None] = mapped_column(String(20))
    address: Mapped[str] = mapped_column(String(300), nullable=False)
    rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 2), default=0.00)

    user: Mapped[User] = relationship(back_populates="supplier")
    products: Mapped[list["Product"]] = relationship(
        back_populates="supplier", passive_deletes=True
    )


class Category(Base):
    __tablename__ = "categories"

    category_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True)
    parent_id: Mapped[int | None] = mapped_column(
        ForeignKey("categories.category_id", ondelete="SET NULL")
    )

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    supplier_id: Mapped[int] = mapped_column(
        ForeignKey("suppliers.supplier_id", ondelete="CASCADE"), nullable=False
    )
    category_id: Mapped[int] = mapped_column(
        ForeignKey("categories.category_id", ondelete="RESTRICT"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    unit: Mapped[str] = mapped_column(String(30), nullable=False, default="kg")
    image_url: Mapped[str | None] = mapped_column(String(500))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    supplier: Mapped[Supplier] = relationship(back_populates="products")
    category: Mapped[Category] = relationship(back_populates="products")
    inventory: Mapped["Inventory | None"] = relationship(
        back_populates="product", uselist=False, passive_deletes=True
    )
    reviews: Mapped[list["Review"]] = relationship(
        back_populates="product", passive_deletes=True
    )


class Inventory(Base):
    __tablename__ = "inventory"

    inventory_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False, unique=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_level: Mapped[int] = mapped_column(Integer, nullable=False, default=10)
    last_updated: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    product: Mapped[Product] = relationship(back_populates="inventory")


class Order(Base):
    __tablename__ = "orders"

    order_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    status: Mapped[str] = mapped_column(order_status_enum, nullable=False, default="pending")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=0.00)
    delivery_addr: Mapped[str] = mapped_column(String(400), nullable=False)
    ordered_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    farmer: Mapped[User] = relationship(back_populates="orders")
    details: Mapped[list["OrderDetail"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", passive_deletes=True
    )
    payment: Mapped["Payment | None"] = relationship(
        back_populates="order", uselist=False, passive_deletes=True
    )


class OrderDetail(Base):
    __tablename__ = "order_details"

    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.order_id", ondelete="CASCADE"), primary_key=True
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"), primary_key=True
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price_snapshot: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(
        Numeric(14, 2),
        Computed("quantity * unit_price_snapshot", persisted=True),
    )

    order: Mapped[Order] = relationship(back_populates="details")
    product: Mapped[Product] = relationship()


class Payment(Base):
    __tablename__ = "payments"

    payment_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    order_id: Mapped[int] = mapped_column(
        ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False, unique=True
    )
    method: Mapped[str] = mapped_column(payment_method_enum, nullable=False)
    status: Mapped[str] = mapped_column(payment_status_enum, nullable=False, default="pending")
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime)
    reference_no: Mapped[str | None] = mapped_column(String(100))

    order: Mapped[Order] = relationship(back_populates="payment")


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("farmer_id", "product_id", name="uq_review_pair"),
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_review_rating"),
    )

    review_id: Mapped[int] = mapped_column(Integer, primary_key=True)
    farmer_id: Mapped[int] = mapped_column(
        ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False
    )
    product_id: Mapped[int] = mapped_column(
        ForeignKey("products.product_id", ondelete="CASCADE"), nullable=False
    )
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, server_default=func.current_timestamp()
    )

    farmer: Mapped[User] = relationship(back_populates="reviews")
    product: Mapped[Product] = relationship(back_populates="reviews")
