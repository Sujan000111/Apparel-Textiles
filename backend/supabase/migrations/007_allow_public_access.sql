-- ============================================================================
-- Migration 007: Allow Public (Anon) Access for Admin Dashboard
-- Apparel & Textiles - Supabase Backend
--
-- Since the Admin Dashboard now bypasses login, all frontend requests are 
-- made anonymously. This script updates the RLS (Row Level Security) policies
-- to allow full public access (SELECT, INSERT, UPDATE, DELETE) to all tables.
-- ============================================================================

-- Categories
DROP POLICY IF EXISTS "categories_all_public" ON categories;
CREATE POLICY "categories_all_public" ON categories FOR ALL USING (true) WITH CHECK (true);

-- Products
DROP POLICY IF EXISTS "products_all_public" ON products;
CREATE POLICY "products_all_public" ON products FOR ALL USING (true) WITH CHECK (true);

-- Customers
DROP POLICY IF EXISTS "customers_all_public" ON customers;
CREATE POLICY "customers_all_public" ON customers FOR ALL USING (true) WITH CHECK (true);

-- Orders
DROP POLICY IF EXISTS "orders_all_public" ON orders;
CREATE POLICY "orders_all_public" ON orders FOR ALL USING (true) WITH CHECK (true);

-- Order Items
DROP POLICY IF EXISTS "order_items_all_public" ON order_items;
CREATE POLICY "order_items_all_public" ON order_items FOR ALL USING (true) WITH CHECK (true);

-- Inventory Log
DROP POLICY IF EXISTS "inventory_log_all_public" ON inventory_log;
CREATE POLICY "inventory_log_all_public" ON inventory_log FOR ALL USING (true) WITH CHECK (true);
