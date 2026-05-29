import { supabase } from '../config/supabase.js';

export const InventoryService = {
  async adjustStock(productId, quantityChange, changeType, notes = '') {
    // Get current stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', productId)
      .single();

    if (fetchError) return { data: null, error: fetchError };

    const newStock = product.stock_quantity + quantityChange;
    if (newStock < 0) return { data: null, error: { message: 'Insufficient stock' } };

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: newStock })
      .eq('id', productId);

    if (updateError) return { data: null, error: updateError };

    // Log the inventory change
    const { data, error } = await supabase
      .from('inventory_log')
      .insert([{
        product_id: productId,
        change_type: changeType,
        quantity_change: quantityChange,
        stock_after: newStock,
        notes,
      }])
      .select();

    return { data: data?.[0], error };
  },

  async getLog(productId, limit = 50) {
    let query = supabase
      .from('inventory_log')
      .select('*, products(id, name)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (productId) query = query.eq('product_id', productId);

    const { data, error } = await query;
    return { data, error };
  },

  async getLowStock(threshold = 20) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .lte('stock_quantity', threshold)
      .eq('is_active', true)
      .order('stock_quantity');
    return { data, error };
  },

  async getStockSummary() {
    const { data, error } = await supabase
      .from('products')
      .select('id, name, stock_quantity, price, categories(name)')
      .eq('is_active', true)
      .order('name');
    return { data, error };
  },
};
