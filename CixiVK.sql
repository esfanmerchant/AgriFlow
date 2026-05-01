-- =============================================================
--  AgriFlow: Fertilizer & Agri-Supply Marketplace
--  schema.sql  –  BCNF-Normalised, MySQL 8+
--  Every table is in BCNF: every determinant is a candidate key.
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS Reviews, Payments, Order_Details, Orders,
                     Inventory, Products, Categories, Suppliers, Users;
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------
-- 1. Users
--    No transitive deps: role does NOT determine any non-key col.
-- -----------------------------------------------------------
CREATE TABLE Users (
    user_id     INT UNSIGNED    NOT NULL AUTO_INCREMENT,
    full_name   VARCHAR(120)    NOT NULL,
    email       VARCHAR(180)    NOT NULL,
    password_hash VARCHAR(256)  NOT NULL,
    phone       VARCHAR(20)     DEFAULT NULL,
    role        ENUM('farmer','supplier','admin') NOT NULL DEFAULT 'farmer',
    created_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_users   PRIMARY KEY (user_id),
    CONSTRAINT uq_email   UNIQUE      (email)
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 2. Suppliers
--    Separated from Users to avoid multi-valued supplier attrs
--    creating a partial / transitive dependency inside Users.
--    Determinant: supplier_id (PK) and user_id (candidate key).
-- -----------------------------------------------------------
CREATE TABLE Suppliers (
    supplier_id     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id         INT UNSIGNED NOT NULL,          -- FK → Users
    company_name    VARCHAR(160) NOT NULL,
    gst_number      VARCHAR(20)  DEFAULT NULL,
    address         VARCHAR(300) NOT NULL,
    rating          DECIMAL(3,2) DEFAULT 0.00,
    CONSTRAINT pk_suppliers        PRIMARY KEY (supplier_id),
    CONSTRAINT uq_supplier_user    UNIQUE      (user_id),
    CONSTRAINT fk_sup_user         FOREIGN KEY (user_id)
        REFERENCES Users(user_id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 3. Categories
--    Flat lookup; parent_id enables a self-referencing hierarchy
--    without violating BCNF (no non-trivial FDs beyond PK).
-- -----------------------------------------------------------
CREATE TABLE Categories (
    category_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name          VARCHAR(80)  NOT NULL,
    parent_id     INT UNSIGNED DEFAULT NULL,        -- self-ref
    CONSTRAINT pk_categories  PRIMARY KEY (category_id),
    CONSTRAINT uq_cat_name    UNIQUE      (name),
    CONSTRAINT fk_cat_parent  FOREIGN KEY (parent_id)
        REFERENCES Categories(category_id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 4. Products
--    unit_price lives here — determined solely by product_id.
--    supplier_id is a FK, not a determinant of price (BCNF safe).
-- -----------------------------------------------------------
CREATE TABLE Products (
    product_id    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    supplier_id   INT UNSIGNED   NOT NULL,
    category_id   INT UNSIGNED   NOT NULL,
    name          VARCHAR(180)   NOT NULL,
    description   TEXT           DEFAULT NULL,
    unit_price    DECIMAL(12,2)  NOT NULL,
    unit          VARCHAR(30)    NOT NULL DEFAULT 'kg',  -- kg, L, bag …
    image_url     VARCHAR(500)   DEFAULT NULL,
    is_active     TINYINT(1)     NOT NULL DEFAULT 1,
    created_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_products      PRIMARY KEY (product_id),
    CONSTRAINT fk_prod_supplier FOREIGN KEY (supplier_id)
        REFERENCES Suppliers(supplier_id) ON DELETE CASCADE,
    CONSTRAINT fk_prod_category FOREIGN KEY (category_id)
        REFERENCES Categories(category_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 5. Inventory
--    One row per product (1-1 here; extend to warehouses via
--    a (product_id, warehouse_id) PK without losing BCNF).
-- -----------------------------------------------------------
CREATE TABLE Inventory (
    inventory_id  INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    product_id    INT UNSIGNED  NOT NULL,
    quantity      INT UNSIGNED  NOT NULL DEFAULT 0,
    reorder_level INT UNSIGNED  NOT NULL DEFAULT 10,
    last_updated  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_inventory       PRIMARY KEY (inventory_id),
    CONSTRAINT uq_inv_product     UNIQUE      (product_id),
    CONSTRAINT fk_inv_product     FOREIGN KEY (product_id)
        REFERENCES Products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 6. Orders
--    total_amount is a derived summary stored for performance
--    (consistent with BCNF — it is functionally determined by
--    order_id, not by a non-key attribute).
-- -----------------------------------------------------------
CREATE TABLE Orders (
    order_id      INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    farmer_id     INT UNSIGNED   NOT NULL,          -- FK → Users (farmer)
    status        ENUM('pending','confirmed','shipped','delivered','cancelled')
                                 NOT NULL DEFAULT 'pending',
    total_amount  DECIMAL(14,2)  NOT NULL DEFAULT 0.00,
    delivery_addr VARCHAR(400)   NOT NULL,
    ordered_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP
                                 ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT pk_orders      PRIMARY KEY (order_id),
    CONSTRAINT fk_ord_farmer  FOREIGN KEY (farmer_id)
        REFERENCES Users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 7. Order_Details
--    Composite PK (order_id, product_id) — BCNF: every
--    determinant is a candidate key.
--    unit_price_snapshot avoids FD on Products.unit_price
--    changing after the order is placed.
-- -----------------------------------------------------------
CREATE TABLE Order_Details (
    order_id             INT UNSIGNED   NOT NULL,
    product_id           INT UNSIGNED   NOT NULL,
    quantity             INT UNSIGNED   NOT NULL,
    unit_price_snapshot  DECIMAL(12,2)  NOT NULL,
    line_total           DECIMAL(14,2)  GENERATED ALWAYS AS
                             (quantity * unit_price_snapshot) STORED,
    CONSTRAINT pk_order_details   PRIMARY KEY (order_id, product_id),
    CONSTRAINT fk_od_order        FOREIGN KEY (order_id)
        REFERENCES Orders(order_id) ON DELETE CASCADE,
    CONSTRAINT fk_od_product      FOREIGN KEY (product_id)
        REFERENCES Products(product_id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 8. Payments
--    One payment per order (can be extended to partial payments
--    by dropping the UNIQUE on order_id).
-- -----------------------------------------------------------
CREATE TABLE Payments (
    payment_id    INT UNSIGNED   NOT NULL AUTO_INCREMENT,
    order_id      INT UNSIGNED   NOT NULL,
    method        ENUM('cash','bank_transfer','mobile_wallet','card')
                                 NOT NULL,
    status        ENUM('pending','completed','failed','refunded')
                                 NOT NULL DEFAULT 'pending',
    amount        DECIMAL(14,2)  NOT NULL,
    paid_at       DATETIME       DEFAULT NULL,
    reference_no  VARCHAR(100)   DEFAULT NULL,
    CONSTRAINT pk_payments     PRIMARY KEY (payment_id),
    CONSTRAINT uq_pay_order    UNIQUE      (order_id),
    CONSTRAINT fk_pay_order    FOREIGN KEY (order_id)
        REFERENCES Orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- 9. Reviews
--    (farmer_id, product_id) is a candidate key — one review
--    per farmer per product, preventing duplicate FDs.
-- -----------------------------------------------------------
CREATE TABLE Reviews (
    review_id   INT UNSIGNED  NOT NULL AUTO_INCREMENT,
    farmer_id   INT UNSIGNED  NOT NULL,
    product_id  INT UNSIGNED  NOT NULL,
    rating      TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT          DEFAULT NULL,
    created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_reviews        PRIMARY KEY (review_id),
    CONSTRAINT uq_review_pair    UNIQUE      (farmer_id, product_id),
    CONSTRAINT fk_rev_farmer     FOREIGN KEY (farmer_id)
        REFERENCES Users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_rev_product    FOREIGN KEY (product_id)
        REFERENCES Products(product_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------------------------------------------
-- Indexes for common JOIN / filter paths
-- -----------------------------------------------------------
CREATE INDEX idx_products_supplier ON Products(supplier_id);
CREATE INDEX idx_products_category ON Products(category_id);
CREATE INDEX idx_orders_farmer     ON Orders(farmer_id);
CREATE INDEX idx_orders_status     ON Orders(status);
CREATE INDEX idx_inventory_qty     ON Inventory(quantity);
CREATE INDEX idx_reviews_product   ON Reviews(product_id);

-- -----------------------------------------------------------
-- Seed: one admin user (password = 'admin123' — bcrypt hash)
-- -----------------------------------------------------------
INSERT INTO Users (full_name, email, password_hash, role) VALUES
('AgriFlow Admin', 'admin@agriflow.pk',
 '$2b$12$placeholder_bcrypt_hash_here', 'admin');

INSERT INTO Categories (name) VALUES
('Fertilizers'), ('Pesticides'), ('Seeds'), ('Farm Tools'), ('Irrigation');
