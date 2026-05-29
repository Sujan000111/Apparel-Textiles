-- ============================================================================
-- Migration 003: Create RLS Policies
-- Apparel & Textiles - Supabase Backend
--
-- Enables Row Level Security on ALL tables and creates access policies:
--   - Categories:     Public SELECT, authenticated INSERT/UPDATE/DELETE
--   - Products:       Public SELECT (active only), authenticated full CRUD
--   - Customers:      Authenticated full CRUD
--   - Orders:         Authenticated SELECT all, public INSERT (checkout)
--   - Order Items:    Authenticated SELECT/INSERT
--   - Inventory Log:  Authenticated only
-- ============================================================================

-- =========================
-- ENABLE RLS ON ALL TABLES
-- =========================
ALTER TABLE categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE products      ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_log ENABLE ROW LEVEL SECURITY;

-- =========================
-- CATEGORIES POLICIES
-- =========================
-- Anyone can view categories
CREATE POLICY "categories_select_public"
    ON categories FOR SELECT
    USING (true);

-- Authenticated users can insert categories
CREATE POLICY "categories_insert_authenticated"
    ON categories FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can update categories
CREATE POLICY "categories_update_authenticated"
    ON categories FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete categories
CREATE POLICY "categories_delete_authenticated"
    ON categories FOR DELETE
    TO authenticated
    USING (true);

-- =========================
-- PRODUCTS POLICIES
-- =========================
-- Anyone can view active products
CREATE POLICY "products_select_public"
    ON products FOR SELECT
    USING (is_active = true);

-- Authenticated users can view ALL products (including inactive)
CREATE POLICY "products_select_all_authenticated"
    ON products FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can insert products
CREATE POLICY "products_insert_authenticated"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can update products
CREATE POLICY "products_update_authenticated"
    ON products FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete products
CREATE POLICY "products_delete_authenticated"
    ON products FOR DELETE
    TO authenticated
    USING (true);

-- =========================
-- CUSTOMERS POLICIES
-- =========================
-- Authenticated users can view all customers
CREATE POLICY "customers_select_authenticated"
    ON customers FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can insert customers
CREATE POLICY "customers_insert_authenticated"
    ON customers FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can update customers
CREATE POLICY "customers_update_authenticated"
    ON customers FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete customers
CREATE POLICY "customers_delete_authenticated"
    ON customers FOR DELETE
    TO authenticated
    USING (true);

-- =========================
-- ORDERS POLICIES
-- =========================
-- Authenticated users can view all orders
CREATE POLICY "orders_select_authenticated"
    ON orders FOR SELECT
    TO authenticated
    USING (true);

-- Public can insert orders (guest checkout)
CREATE POLICY "orders_insert_public"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Authenticated users can update orders
CREATE POLICY "orders_update_authenticated"
    ON orders FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete orders
CREATE POLICY "orders_delete_authenticated"
    ON orders FOR DELETE
    TO authenticated
    USING (true);

-- =========================
-- ORDER ITEMS POLICIES
-- =========================
-- Authenticated users can view all order items
CREATE POLICY "order_items_select_authenticated"
    ON order_items FOR SELECT
    TO authenticated
    USING (true);

-- Public can insert order items (follows order insertion for checkout)
CREATE POLICY "order_items_insert_public"
    ON order_items FOR INSERT
    WITH CHECK (true);

-- Authenticated users can update order items
CREATE POLICY "order_items_update_authenticated"
    ON order_items FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete order items
CREATE POLICY "order_items_delete_authenticated"
    ON order_items FOR DELETE
    TO authenticated
    USING (true);

-- =========================
-- INVENTORY LOG POLICIES
-- =========================
-- Authenticated users can view inventory logs
CREATE POLICY "inventory_log_select_authenticated"
    ON inventory_log FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can insert inventory logs
CREATE POLICY "inventory_log_insert_authenticated"
    ON inventory_log FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Authenticated users can update inventory logs
CREATE POLICY "inventory_log_update_authenticated"
    ON inventory_log FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Authenticated users can delete inventory logs
CREATE POLICY "inventory_log_delete_authenticated"
    ON inventory_log FOR DELETE
    TO authenticated
    USING (true);
