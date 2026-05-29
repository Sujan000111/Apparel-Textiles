-- ============================================================================
-- Migration 002: Create Views
-- Apparel & Textiles - Supabase Backend
--
-- Analytics and reporting views for the dashboard:
--   1. v_product_sales_summary   - Per-product sales metrics
--   2. v_category_revenue_share  - Revenue breakdown by category
--   3. v_sales_summary           - Single-row KPI summary
--   4. v_monthly_sales_trend     - Monthly revenue and order counts
--   5. v_top_customers           - Customers ranked by spend
--   6. v_inventory_status        - Current stock levels with low-stock flags
-- ============================================================================

-- =========================
-- 1. PRODUCT SALES SUMMARY
-- =========================
CREATE OR REPLACE VIEW v_product_sales_summary AS
SELECT
    p.id            AS product_id,
    p.name          AS product_name,
    c.name          AS category_name,
    p.price         AS current_price,
    COALESCE(SUM(oi.quantity), 0)    AS total_units_sold,
    COALESCE(SUM(oi.total_price), 0) AS total_revenue
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN order_items oi ON oi.product_id = p.id
LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
GROUP BY p.id, p.name, c.name, p.price
ORDER BY total_revenue DESC;

COMMENT ON VIEW v_product_sales_summary IS 'Per-product sales breakdown with category and revenue';

-- =========================
-- 2. CATEGORY REVENUE SHARE
-- =========================
CREATE OR REPLACE VIEW v_category_revenue_share AS
WITH category_totals AS (
    SELECT
        c.name                          AS category_name,
        COALESCE(SUM(oi.total_price), 0) AS total_revenue
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
    GROUP BY c.name
)
SELECT
    category_name,
    total_revenue,
    CASE
        WHEN SUM(total_revenue) OVER () = 0 THEN 0
        ELSE ROUND((total_revenue / SUM(total_revenue) OVER ()) * 100, 2)
    END AS revenue_percentage
FROM category_totals
ORDER BY total_revenue DESC;

COMMENT ON VIEW v_category_revenue_share IS 'Revenue distribution across product categories';

-- =========================
-- 3. SALES SUMMARY (Single Row KPIs)
-- =========================
CREATE OR REPLACE VIEW v_sales_summary AS
WITH order_stats AS (
    SELECT
        COALESCE(SUM(total_amount), 0) AS total_revenue,
        COUNT(*)                        AS total_orders,
        COALESCE(AVG(total_amount), 0)  AS avg_order_value
    FROM orders
    WHERE status != 'cancelled'
),
product_stats AS (
    SELECT COUNT(*) AS total_products
    FROM products
    WHERE is_active = true
),
customer_stats AS (
    SELECT COUNT(*) AS total_customers
    FROM customers
),
best_seller AS (
    SELECT
        p.name AS best_seller_name,
        SUM(oi.total_price) AS revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
    GROUP BY p.name
    ORDER BY revenue DESC
    LIMIT 1
),
most_units AS (
    SELECT
        p.name AS most_units_product,
        SUM(oi.quantity) AS units_sold
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
    GROUP BY p.name
    ORDER BY units_sold DESC
    LIMIT 1
)
SELECT
    os.total_revenue,
    os.total_orders,
    ROUND(os.avg_order_value, 2) AS avg_order_value,
    ps.total_products,
    cs.total_customers,
    bs.best_seller_name,
    mu.most_units_product
FROM order_stats os
CROSS JOIN product_stats ps
CROSS JOIN customer_stats cs
LEFT JOIN best_seller bs ON true
LEFT JOIN most_units mu ON true;

COMMENT ON VIEW v_sales_summary IS 'Single-row dashboard KPI summary';

-- =========================
-- 4. MONTHLY SALES TREND
-- =========================
CREATE OR REPLACE VIEW v_monthly_sales_trend AS
SELECT
    TO_CHAR(DATE_TRUNC('month', o.order_date), 'YYYY-MM') AS month,
    COALESCE(SUM(o.total_amount), 0)                       AS total_revenue,
    COUNT(*)                                                AS order_count
FROM orders o
WHERE o.status != 'cancelled'
GROUP BY DATE_TRUNC('month', o.order_date)
ORDER BY DATE_TRUNC('month', o.order_date);

COMMENT ON VIEW v_monthly_sales_trend IS 'Monthly revenue and order volume trends';

-- =========================
-- 5. TOP CUSTOMERS
-- =========================
CREATE OR REPLACE VIEW v_top_customers AS
SELECT
    c.id             AS customer_id,
    c.full_name      AS customer_name,
    c.email,
    COUNT(o.id)                       AS total_orders,
    COALESCE(SUM(o.total_amount), 0)  AS total_spent
FROM customers c
LEFT JOIN orders o ON o.customer_id = c.id AND o.status != 'cancelled'
GROUP BY c.id, c.full_name, c.email
ORDER BY total_spent DESC;

COMMENT ON VIEW v_top_customers IS 'Customers ranked by total spend';

-- =========================
-- 6. INVENTORY STATUS
-- =========================
CREATE OR REPLACE VIEW v_inventory_status AS
SELECT
    p.id            AS product_id,
    p.name          AS product_name,
    c.name          AS category_name,
    p.stock_quantity AS current_stock,
    p.price,
    (p.stock_quantity * p.price) AS stock_value,
    CASE
        WHEN p.stock_quantity < 20 THEN true
        ELSE false
    END AS low_stock
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.is_active = true
ORDER BY p.stock_quantity ASC;

COMMENT ON VIEW v_inventory_status IS 'Current inventory levels with low-stock flagging (threshold: 20)';
