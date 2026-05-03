-- =============================================================
--  AgriFlow: Fertilizer & Agri-Supply Marketplace
--  schema.postgres.sql  –  PostgreSQL 17+
--  Converted from CixiVK.sql (MySQL). BCNF-normalised.
-- =============================================================

-- Drop in dependency order (CASCADE handles dependents safely)
DROP TABLE IF EXISTS reviews, payments, order_details, orders,
                     inventory, products, categories, suppliers, users CASCADE;
DROP TYPE  IF EXISTS user_role, order_status, payment_method, payment_status CASCADE;

-- -----------------------------------------------------------
-- ENUM types (PostgreSQL native)
-- -----------------------------------------------------------
CREATE TYPE user_role      AS ENUM ('farmer','supplier','admin');
CREATE TYPE order_status   AS ENUM ('pending','confirmed','shipped','delivered','cancelled');
CREATE TYPE payment_method AS ENUM ('cash','bank_transfer','mobile_wallet','card');
CREATE TYPE payment_status AS ENUM ('pending','completed','failed','refunded');

-- -----------------------------------------------------------
-- 1. Users
-- -----------------------------------------------------------
CREATE TABLE users (
    user_id       INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    full_name     VARCHAR(120)  NOT NULL,
    email         VARCHAR(180)  NOT NULL UNIQUE,
    password_hash VARCHAR(256)  NOT NULL,
    phone         VARCHAR(20),
    role          user_role     NOT NULL DEFAULT 'farmer',
    is_approved   BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Application sets is_approved = FALSE for new supplier signups; admins must
-- approve before the supplier can sign in or list products. Farmers and admins
-- are auto-approved.

-- -----------------------------------------------------------
-- 2. Suppliers
-- -----------------------------------------------------------
CREATE TABLE suppliers (
    supplier_id  INTEGER       GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      INTEGER       NOT NULL UNIQUE REFERENCES users(user_id) ON DELETE CASCADE,
    company_name VARCHAR(160)  NOT NULL,
    gst_number   VARCHAR(20),
    address      VARCHAR(300)  NOT NULL,
    rating       NUMERIC(3,2)  DEFAULT 0.00
);

-- -----------------------------------------------------------
-- 3. Categories  (self-referencing hierarchy)
-- -----------------------------------------------------------
CREATE TABLE categories (
    category_id INTEGER      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        VARCHAR(80)  NOT NULL UNIQUE,
    parent_id   INTEGER      REFERENCES categories(category_id) ON DELETE SET NULL
);

-- -----------------------------------------------------------
-- 4. Products
-- -----------------------------------------------------------
CREATE TABLE products (
    product_id  INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supplier_id INTEGER        NOT NULL REFERENCES suppliers(supplier_id)   ON DELETE CASCADE,
    category_id INTEGER        NOT NULL REFERENCES categories(category_id)  ON DELETE RESTRICT,
    name        VARCHAR(180)   NOT NULL,
    description TEXT,
    unit_price  NUMERIC(12,2)  NOT NULL CHECK (unit_price >= 0),
    unit        VARCHAR(30)    NOT NULL DEFAULT 'kg',
    image_url   VARCHAR(500),
    is_active   BOOLEAN        NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 5. Inventory
-- -----------------------------------------------------------
CREATE TABLE inventory (
    inventory_id  INTEGER   GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id    INTEGER   NOT NULL UNIQUE REFERENCES products(product_id) ON DELETE CASCADE,
    quantity      INTEGER   NOT NULL DEFAULT 0  CHECK (quantity >= 0),
    reorder_level INTEGER   NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
    last_updated  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 6. Orders
-- -----------------------------------------------------------
CREATE TABLE orders (
    order_id      INTEGER        GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farmer_id     INTEGER        NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status        order_status   NOT NULL DEFAULT 'pending',
    total_amount  NUMERIC(14,2)  NOT NULL DEFAULT 0.00,
    delivery_addr VARCHAR(400)   NOT NULL,
    ordered_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------
-- 7. Order_Details  (composite PK)
-- -----------------------------------------------------------
CREATE TABLE order_details (
    order_id            INTEGER        NOT NULL REFERENCES orders(order_id)     ON DELETE CASCADE,
    product_id          INTEGER        NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    quantity            INTEGER        NOT NULL CHECK (quantity > 0),
    unit_price_snapshot NUMERIC(12,2)  NOT NULL,
    line_total          NUMERIC(14,2)  GENERATED ALWAYS AS (quantity * unit_price_snapshot) STORED,
    PRIMARY KEY (order_id, product_id)
);

-- -----------------------------------------------------------
-- 8. Payments
-- -----------------------------------------------------------
CREATE TABLE payments (
    payment_id   INTEGER         GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id     INTEGER         NOT NULL UNIQUE REFERENCES orders(order_id) ON DELETE CASCADE,
    method       payment_method  NOT NULL,
    status       payment_status  NOT NULL DEFAULT 'pending',
    amount       NUMERIC(14,2)   NOT NULL CHECK (amount >= 0),
    paid_at      TIMESTAMP,
    reference_no VARCHAR(100)
);

-- -----------------------------------------------------------
-- 9. Reviews
-- -----------------------------------------------------------
CREATE TABLE reviews (
    review_id  INTEGER    GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    farmer_id  INTEGER    NOT NULL REFERENCES users(user_id)       ON DELETE CASCADE,
    product_id INTEGER    NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    rating     SMALLINT   NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMP  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmer_id, product_id)
);

-- -----------------------------------------------------------
-- ON UPDATE CURRENT_TIMESTAMP equivalents (PostgreSQL has no inline syntax)
-- -----------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_set_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION set_last_updated() RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_set_last_updated
    BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION set_last_updated();

-- -----------------------------------------------------------
-- Indexes for common JOIN / filter paths
-- -----------------------------------------------------------
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_orders_farmer     ON orders(farmer_id);
CREATE INDEX idx_orders_status     ON orders(status);
CREATE INDEX idx_inventory_qty     ON inventory(quantity);
CREATE INDEX idx_reviews_product   ON reviews(product_id);

-- -----------------------------------------------------------
-- Seed data
-- -----------------------------------------------------------
INSERT INTO users (full_name, email, password_hash, role) VALUES
('AgriFlow Admin', 'admin@agriflow.pk',
 '$2b$12$placeholder_bcrypt_hash_here', 'admin');

INSERT INTO categories (name) VALUES
('Fertilizers'), ('Pesticides'), ('Seeds'), ('Farm Tools'), ('Irrigation');
