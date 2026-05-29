import { supabase } from '../config/supabase.js';

export const OrdersService = {
  async getAll({ status = null, page = 1, limit = 20, dateFrom = null, dateTo = null } = {}) {
    let query = supabase
      .from('orders')
      .select('*, customers(id, full_name, email)', { count: 'exact' });

    if (status) query = query.eq('status', status);
    if (dateFrom) query = query.gte('order_date', dateFrom);
    if (dateTo) query = query.lte('order_date', dateTo);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('order_date', { ascending: false });

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(id, full_name, email, phone, address, city, state, pincode),
        order_items(id, quantity, unit_price, total_price, products(id, name, slug, image_url, price))
      `)
      .eq('id', id)
      .single();
    return { data, error };
  },

  async create({ customer_id, items, payment_method = 'cod', shipping_address = '' }) {
    // Calculate total
    let total = 0;
    for (const item of items) {
      total += item.unit_price * item.quantity;
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id,
        total_amount: total,
        payment_method,
        shipping_address,
        status: 'pending',
        payment_status: 'pending',
      }])
      .select()
      .single();

    if (orderError) return { data: null, error: orderError };

    // Create order items
    const orderItems = items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) return { data: order, error: itemsError };

    return { data: order, error: null };
  },

  async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async updatePaymentStatus(id, paymentStatus) {
    const { data, error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus })
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async getByCustomer(customerId) {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(id, quantity, unit_price, total_price, products(id, name, image_url))')
      .eq('customer_id', customerId)
      .order('order_date', { ascending: false });
    return { data, error };
  },

  subscribeToNewOrders(callback) {
    return supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, callback)
      .subscribe();
  },
};
