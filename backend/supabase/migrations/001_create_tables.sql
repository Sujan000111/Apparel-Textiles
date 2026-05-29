-- ============================================================================
-- Migration 001: Create Tables
-- Apparel & Textiles - Supabase Backend
-- 
-- Creates the core database schema:
--   1. categories      - Product categories (Men, Women, Kids, etc.)
--   2. products         - Product catalog with pricing and stock
--   3. customers        - Customer profiles and addresses
--   4. orders           - Order header with status and payment tracking
--   5. order_items      - Line items for each order
--   6. inventory_log    - Stock movement audit trail
--
-- All tables use UUID primary keys with gen_random_uuid() defaults.
-- Foreign keys, check constraints, and indexes are included.
-- ============================================================================

-- =========================
-- 1. CATEGORIES
-- =========================
CREATE TABLE IF NOT EXISTS categories (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT        NOT NULL,
    slug        TEXT        UNIQUE NOT NULL,
    description TEXT,
    image_url   TEXT,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE categories IS 'Product categories for the apparel store';

-- =========================
-- 2. PRODUCTS
-- =========================
CREATE TABLE IF NOT EXISTS products (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT        NOT NULL,
    slug            TEXT        UNIQUE NOT NULL,
    description     TEXT,
    category_id     UUID        REFERENCES categories(id) ON DELETE SET NULL,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    stock_quantity  INTEGER     DEFAULT 0 CHECK (stock_quantity >= 0),
    image_url       TEXT,
    is_active       BOOLEAN     DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE products IS 'Product catalog with pricing, stock, and category linkage';

-- =========================
-- 3. CUSTOMERS
-- =========================
CREATE TABLE IF NOT EXISTS customers (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id  UUID,                             -- nullable, links to auth.users
    full_name     TEXT        NOT NULL,
    email         TEXT        UNIQUE NOT NULL,
    phone         TEXT,
    address       TEXT,
    city          TEXT,
    state         TEXT,
    pincode       TEXT,
    created_at    TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE customers IS 'Customer profiles with contact and shipping information';

-- =========================
-- 4. ORDERS
-- =========================
CREATE TABLE IF NOT EXISTS orders (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number     TEXT        UNIQUE NOT NULL,
    customer_id      UUID        REFERENCES customers(id),
    total_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
    status           TEXT        DEFAULT 'pending'
                                 CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
    payment_method   TEXT        DEFAULT 'cod'
                                 CHECK (payment_method IN ('cod','upi','card','netbanking')),
    payment_status   TEXT        DEFAULT 'pending'
                                 CHECK (payment_status IN ('pending','paid','failed','refunded')),
    shipping_address TEXT,
    notes            TEXT,
    order_date       TIMESTAMPTZ DEFAULT now(),
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE orders IS 'Order headers with status, payment, and shipping details';

-- =========================
-- 5. ORDER ITEMS
-- =========================
CREATE TABLE IF NOT EXISTS order_items (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id    UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id  UUID        REFERENCES products(id),
    quantity    INTEGER     NOT NULL CHECK (quantity > 0),
    unit_price  NUMERIC(10,2) NOT NULL,
    total_price NUMERIC(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

COMMENT ON TABLE order_items IS 'Individual line items belonging to an order';

-- =========================
-- 6. INVENTORY LOG
-- =========================
CREATE TABLE IF NOT EXISTS inventory_log (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID        NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_type     TEXT        NOT NULL
                                CHECK (change_type IN ('restock','sale','adjustment','return')),
    quantity_change  INTEGER    NOT NULL,
    stock_after     INTEGER     NOT NULL,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE inventory_log IS 'Audit trail for all inventory movements';

-- ============================================================================
-- INDEXES
-- Indexes on foreign keys and frequently queried columns
-- ============================================================================

-- Products
CREATE INDEX IF NOT EXISTS idx_products_category_id   ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active      ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_slug           ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_created_at     ON products(created_at);

-- Categories
CREATE INDEX IF NOT EXISTS idx_categories_slug         ON categories(slug);

-- Customers
CREATE INDEX IF NOT EXISTS idx_customers_auth_user_id  ON customers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email         ON customers(email);

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id      ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status           ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status   ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_order_date       ON orders(order_date);
CREATE INDEX IF NOT EXISTS idx_orders_order_number     ON orders(order_number);

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id  ON order_items(product_id);

-- Inventory Log
CREATE INDEX IF NOT EXISTS idx_inventory_log_product_id  ON inventory_log(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_log_change_type ON inventory_log(change_type);
CREATE INDEX IF NOT EXISTS idx_inventory_log_created_at  ON inventory_log(created_at);
