-- =============================================================
--  Migration 002: Cascade deletes from users → orders → order_details
--  Run against the live DB to fix the admin-cannot-delete bug
--  without dropping existing data.
-- =============================================================

BEGIN;

-- 1. orders.farmer_id : RESTRICT -> CASCADE
ALTER TABLE orders
    DROP CONSTRAINT IF EXISTS orders_farmer_id_fkey;

ALTER TABLE orders
    ADD CONSTRAINT orders_farmer_id_fkey
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE;

-- 2. order_details.product_id : RESTRICT -> CASCADE
ALTER TABLE order_details
    DROP CONSTRAINT IF EXISTS order_details_product_id_fkey;

ALTER TABLE order_details
    ADD CONSTRAINT order_details_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE;

COMMIT;
