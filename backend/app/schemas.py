from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["farmer", "supplier", "admin"]
SignupRole = Literal["farmer", "supplier"]  # admins are hardcoded; never via signup


# --- Auth ---------------------------------------------------------

class SignupRequest(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    role: SignupRole = "farmer"


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    full_name: str
    email: EmailStr
    phone: str | None
    role: Role
    is_approved: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut


# --- Categories ---------------------------------------------------

class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    name: str
    parent_id: int | None


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    parent_id: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=80)
    parent_id: int | None = None


# --- Suppliers ----------------------------------------------------

class SupplierCreate(BaseModel):
    company_name: str = Field(min_length=1, max_length=160)
    gst_number: str | None = Field(default=None, max_length=20)
    address: str = Field(min_length=1, max_length=300)


class SupplierUpdate(BaseModel):
    company_name: str | None = Field(default=None, min_length=1, max_length=160)
    gst_number: str | None = Field(default=None, max_length=20)
    address: str | None = Field(default=None, min_length=1, max_length=300)


class SupplierOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    supplier_id: int
    user_id: int
    company_name: str
    gst_number: str | None
    address: str
    rating: float | None


# --- Products -----------------------------------------------------

class ProductCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=1, max_length=180)
    description: str | None = None
    unit_price: float = Field(ge=0)
    unit: str = Field(default="kg", max_length=30)
    image_url: str | None = Field(default=None, max_length=500)
    initial_quantity: int = Field(default=0, ge=0)
    reorder_level: int = Field(default=10, ge=0)


class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=180)
    description: str | None = None
    unit_price: float | None = Field(default=None, ge=0)
    unit: str | None = Field(default=None, max_length=30)
    image_url: str | None = Field(default=None, max_length=500)
    is_active: bool | None = None
    quantity: int | None = Field(default=None, ge=0)


class ProductOut(BaseModel):
    product_id: int
    name: str
    description: str | None
    unit_price: float
    unit: str
    image_url: str | None
    is_active: bool
    created_at: datetime
    category_id: int
    category_name: str | None
    supplier_id: int
    supplier_name: str | None
    quantity: int
    reorder_level: int


# --- Orders -------------------------------------------------------

OrderStatus = Literal["pending", "confirmed", "shipped", "delivered", "cancelled"]


class OrderItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    delivery_addr: str = Field(min_length=1, max_length=400)
    items: list[OrderItemIn] = Field(min_length=1)


class OrderItemOut(BaseModel):
    product_id: int
    product_name: str
    quantity: int
    unit_price_snapshot: float
    line_total: float


class OrderOut(BaseModel):
    order_id: int
    farmer_id: int
    farmer_name: str
    status: OrderStatus
    total_amount: float
    delivery_addr: str
    ordered_at: datetime
    updated_at: datetime
    items: list[OrderItemOut]
    payment_status: str | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# --- Payments -----------------------------------------------------

PaymentMethod = Literal["cash", "bank_transfer", "mobile_wallet", "card"]
PaymentStatus = Literal["pending", "completed", "failed", "refunded"]


class PaymentCreate(BaseModel):
    order_id: int
    method: PaymentMethod
    amount: float = Field(ge=0)
    reference_no: str | None = Field(default=None, max_length=100)


class PaymentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    payment_id: int
    order_id: int
    method: PaymentMethod
    status: PaymentStatus
    amount: float
    paid_at: datetime | None
    reference_no: str | None


# --- Reviews ------------------------------------------------------

class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    review_id: int
    product_id: int
    farmer_id: int
    farmer_name: str
    rating: int
    comment: str | None
    created_at: datetime


# --- Admin --------------------------------------------------------

class AdminUserCreate(BaseModel):
    full_name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    role: Role = "farmer"


class AdminUserUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=20)
    role: Role | None = None


class AdminStats(BaseModel):
    total_users: int
    farmers: int
    suppliers: int
    admins: int
    total_products: int
    total_orders: int
    gmv: float
    failed_payments: int
