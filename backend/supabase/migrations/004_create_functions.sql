-- ============================================================================
-- Migration 004: Create Functions & Triggers
-- Apparel & Textiles - Supabase Backend
--
-- Creates:
--   1. update_updated_at()      - Trigger function to auto-set updated_at
--   2. Triggers on products and orders tables
--   3. generate_order_number()  - Auto-generates 'ORD-YYYYMMDD-XXXX' order numbers
--   4. Trigger on orders to set order_number before insert
--   5. get_dashboard_stats()    - Returns JSON with all dashboard KPIs
-- ============================================================================

-- =========================
-- 1. UPDATE_UPDATED_AT TRIGGER FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at() IS 'Automatically sets updated_at to current timestamp on row update';

-- =========================
-- 2. APPLY TRIGGER TO PRODUCTS AND ORDERS
-- =========================
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- =========================
-- 3. GENERATE ORDER NUMBER FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    date_part TEXT;
    seq_part  TEXT;
    count_today INTEGER;
BEGIN
    -- Only generate if order_number is not already set
    IF NEW.order_number IS NOT NULL AND NEW.order_number != '' THEN
        RETURN NEW;
    END IF;

    -- Format: ORD-YYYYMMDD-XXXX
    date_part := TO_CHAR(now(), 'YYYYMMDD');

    -- Count existing orders for today to generate sequential number
    SELECT COUNT(*) + 1
    INTO count_today
    FROM orders
    WHERE order_number LIKE 'ORD-' || date_part || '-%';

    -- Pad the sequence to 4 digits
    seq_part := LPAD(count_today::TEXT, 4, '0');

    NEW.order_number := 'ORD-' || date_part || '-' || seq_part;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generate_order_number() IS 'Auto-generates order numbers in ORD-YYYYMMDD-XXXX format';

-- =========================
-- 4. APPLY ORDER NUMBER TRIGGER
-- =========================
CREATE TRIGGER trg_orders_generate_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- =========================
-- 5. GET DASHBOARD STATS FUNCTION
-- =========================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        -- Revenue & Order KPIs
        'total_revenue',     COALESCE((
            SELECT SUM(total_amount) FROM orders WHERE status != 'cancelled'
        ), 0),
        'total_orders',      (
            SELECT COUNT(*) FROM orders WHERE status != 'cancelled'
        ),
        'avg_order_value',   COALESCE(ROUND((
            SELECT AVG(total_amount) FROM orders WHERE status != 'cancelled'
        ), 2), 0),
        'pending_orders',    (
            SELECT COUNT(*) FROM orders WHERE status = 'pending'
        ),
        'delivered_orders',  (
            SELECT COUNT(*) FROM orders WHERE status = 'delivered'
        ),

        -- Product & Inventory KPIs
        'total_products',    (
            SELECT COUNT(*) FROM products WHERE is_active = true
        ),
        'total_stock_value', COALESCE((
            SELECT SUM(stock_quantity * price) FROM products WHERE is_active = true
        ), 0),
        'low_stock_count',   (
            SELECT COUNT(*) FROM products WHERE is_active = true AND stock_quantity < 20
        ),

        -- Customer KPIs
        'total_customers',   (
            SELECT COUNT(*) FROM customers
        ),

        -- Best Seller (by revenue)
        'best_seller',       (
            SELECT json_build_object('name', p.name, 'revenue', SUM(oi.total_price))
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
            GROUP BY p.name
            ORDER BY SUM(oi.total_price) DESC
            LIMIT 1
        ),

        -- Most Sold Product (by units)
        'most_sold_product', (
            SELECT json_build_object('name', p.name, 'units_sold', SUM(oi.quantity))
            FROM order_items oi
            JOIN products p ON p.id = oi.product_id
            JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
            GROUP BY p.name
            ORDER BY SUM(oi.quantity) DESC
            LIMIT 1
        ),

        -- Order Status Breakdown
        'order_status_breakdown', (
            SELECT json_agg(json_build_object('status', status, 'count', cnt))
            FROM (
                SELECT status, COUNT(*) AS cnt
                FROM orders
                GROUP BY status
                ORDER BY cnt DESC
            ) sub
        ),

        -- Category Revenue
        'category_revenue',  (
            SELECT json_agg(json_build_object(
                'category', c.name,
                'revenue', COALESCE(SUM(oi.total_price), 0)
            ))
            FROM categories c
            LEFT JOIN products p ON p.category_id = c.id
            LEFT JOIN order_items oi ON oi.product_id = p.id
            LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
            GROUP BY c.name
            ORDER BY COALESCE(SUM(oi.total_price), 0) DESC
        ),

        -- Monthly Trend (last 6 months)
        'monthly_trend',     (
            SELECT json_agg(json_build_object(
                'month', TO_CHAR(DATE_TRUNC('month', order_date), 'YYYY-MM'),
                'revenue', SUM(total_amount),
                'orders', COUNT(*)
            ))
            FROM orders
            WHERE status != 'cancelled'
              AND order_date >= DATE_TRUNC('month', now()) - INTERVAL '5 months'
            GROUP BY DATE_TRUNC('month', order_date)
            ORDER BY DATE_TRUNC('month', order_date)
        ),

        -- Recent Orders (last 5)
        'recent_orders',     (
            SELECT json_agg(row_to_json(sub))
            FROM (
                SELECT o.order_number, c.full_name AS customer_name,
                       o.total_amount, o.status, o.order_date
                FROM orders o
                LEFT JOIN customers c ON c.id = o.customer_id
                ORDER BY o.order_date DESC
                LIMIT 5
            ) sub
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_dashboard_stats() IS 'Returns comprehensive dashboard KPIs as a single JSON object';
