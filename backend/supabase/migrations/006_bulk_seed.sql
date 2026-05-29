-- Bulk Data Generator for Apparel & Textiles
-- This script generates a massive amount of random data for testing the dashboard.
-- It will add: 50 Products, 100 Customers, and 500 Orders spanning the last 6 months.

DO $$
DECLARE
    v_category_id UUID;
    v_customer_ids UUID[] := '{}';
    v_product_ids UUID[] := '{}';
    v_order_id UUID;
    v_num_items INT;
    v_product_idx INT;
    v_product_id UUID;
    v_product_price NUMERIC;
    v_qty INT;
    v_item_total NUMERIC;
    v_order_total NUMERIC;
    v_date TIMESTAMPTZ;
    v_status TEXT;
    
    -- Arrays for random generation
    cities TEXT[] := ARRAY['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur'];
    states TEXT[] := ARRAY['Maharashtra', 'Delhi', 'Karnataka', 'Telangana', 'Gujarat', 'Tamil Nadu', 'West Bengal', 'Gujarat', 'Maharashtra', 'Rajasthan'];
    first_names TEXT[] := ARRAY['Aarav', 'Vihaan', 'Vivaan', 'Ananya', 'Diya', 'Advik', 'Kabir', 'Anika', 'Navya', 'Ojas', 'Zara', 'Ishan', 'Riya', 'Rohan', 'Neha'];
    last_names TEXT[] := ARRAY['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Singh', 'Patel', 'Kumar', 'Reddy', 'Das', 'Joshi'];
    adjectives TEXT[] := ARRAY['Premium', 'Classic', 'Elegant', 'Modern', 'Vintage', 'Casual', 'Formal', 'Comfort', 'Luxury', 'Essential'];
    items TEXT[] := ARRAY['Shirt', 'T-Shirt', 'Jeans', 'Trousers', 'Jacket', 'Sweater', 'Kurta', 'Saree', 'Lehenga', 'Shorts', 'Dress'];
BEGIN
    -------------------------------------------------------
    -- 1. GENERATE 100 CUSTOMERS
    -------------------------------------------------------
    FOR i IN 1..100 LOOP
        DECLARE
            c_id UUID := gen_random_uuid();
            fn TEXT := first_names[1 + floor(random() * array_length(first_names, 1))];
            ln TEXT := last_names[1 + floor(random() * array_length(last_names, 1))];
            city_idx INT := 1 + floor(random() * array_length(cities, 1));
        BEGIN
            INSERT INTO customers (id, full_name, email, phone, address, city, state, pincode)
            VALUES (
                c_id,
                fn || ' ' || ln,
                lower(fn) || '.' || lower(ln) || i || '@example.com',
                '+91' || (floor(random() * 8999999999) + 1000000000)::TEXT,
                floor(random() * 1000)::TEXT || ' Main Street',
                cities[city_idx],
                states[city_idx],
                (floor(random() * 899999) + 100000)::TEXT
            );
            v_customer_ids := array_append(v_customer_ids, c_id);
        END;
    END LOOP;

    -------------------------------------------------------
    -- 2. GENERATE 50 PRODUCTS (Assumes categories exist)
    -------------------------------------------------------
    FOR i IN 1..50 LOOP
        DECLARE
            p_id UUID := gen_random_uuid();
            adj TEXT := adjectives[1 + floor(random() * array_length(adjectives, 1))];
            itm TEXT := items[1 + floor(random() * array_length(items, 1))];
            p_name TEXT := adj || ' ' || itm || ' ' || i;
            -- Randomly pick an existing category
            cat_id UUID := (SELECT id FROM categories ORDER BY random() LIMIT 1);
        BEGIN
            INSERT INTO products (id, name, slug, description, category_id, price, stock_quantity, image_url)
            VALUES (
                p_id,
                p_name,
                lower(replace(p_name, ' ', '-')),
                'A beautifully crafted ' || lower(itm) || ' perfect for any occasion.',
                cat_id,
                (floor(random() * 30) + 5) * 99, -- Random price like 499, 999, 1499...
                floor(random() * 200) + 10,      -- Stock between 10 and 210
                NULL
            );
            v_product_ids := array_append(v_product_ids, p_id);
        END;
    END LOOP;

    -------------------------------------------------------
    -- 3. GENERATE 500 ORDERS (Over the last 6 months)
    -------------------------------------------------------
    FOR i IN 1..500 LOOP
        v_order_id := gen_random_uuid();
        -- Random date within the last 180 days
        v_date := now() - (random() * 180 || ' days')::INTERVAL;
        
        -- Weighted status (mostly delivered/shipped, some pending/processing/cancelled)
        v_status := CASE (random() * 10)::INT
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'confirmed'
            WHEN 2 THEN 'processing'
            WHEN 3 THEN 'shipped'
            WHEN 4 THEN 'cancelled'
            ELSE 'delivered'
        END;

        -- Insert Order header
        INSERT INTO orders (id, order_number, customer_id, total_amount, status, payment_method, payment_status, order_date, created_at)
        VALUES (
            v_order_id,
            'ORD-' || to_char(v_date, 'YYYYMMDD') || '-' || LPAD(i::TEXT, 4, '0'),
            v_customer_ids[1 + floor(random() * array_length(v_customer_ids, 1))],
            0, -- Will update later
            v_status,
            CASE (random() * 3)::INT WHEN 0 THEN 'upi' WHEN 1 THEN 'card' WHEN 2 THEN 'netbanking' ELSE 'cod' END,
            CASE WHEN v_status = 'cancelled' THEN 'refunded' WHEN v_status IN ('delivered', 'shipped') THEN 'paid' ELSE 'pending' END,
            v_date,
            v_date
        );

        -- Insert 1 to 4 order items per order
        v_order_total := 0;
        v_num_items := floor(random() * 4) + 1;
        
        FOR j IN 1..v_num_items LOOP
            v_product_id := v_product_ids[1 + floor(random() * array_length(v_product_ids, 1))];
            SELECT price INTO v_product_price FROM products WHERE id = v_product_id;
            
            v_qty := floor(random() * 3) + 1;
            v_item_total := v_product_price * v_qty;
            v_order_total := v_order_total + v_item_total;

            INSERT INTO order_items (order_id, product_id, quantity, unit_price)
            VALUES (v_order_id, v_product_id, v_qty, v_product_price);
            
            -- Add inventory log for the sale
            IF v_status != 'cancelled' THEN
                INSERT INTO inventory_log (product_id, change_type, quantity_change, stock_after, created_at)
                VALUES (v_product_id, 'sale', -v_qty, (SELECT stock_quantity FROM products WHERE id = v_product_id) - v_qty, v_date);
            END IF;
        END LOOP;

        -- Update order total
        UPDATE orders SET total_amount = v_order_total WHERE id = v_order_id;
    END LOOP;

END $$;
