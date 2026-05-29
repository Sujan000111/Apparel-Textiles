import { supabase } from '../config/supabase.js';

export const AnalyticsService = {
  /**
   * Get all dashboard KPIs in a single call.
   */
  async getDashboardStats() {
    // Total revenue & order count
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, status');

    const activeOrders = (orders || []).filter(o => o.status !== 'cancelled');
    const totalRevenue = activeOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = activeOrders.length;

    // Total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });

    // Best seller (by revenue)
    const { data: productSales } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price, products(name)');

    const salesMap = {};
    (productSales || []).forEach(item => {
      const name = item.products?.name || 'Unknown';
      if (!salesMap[name]) salesMap[name] = { revenue: 0, units: 0 };
      salesMap[name].revenue += item.quantity * Number(item.unit_price);
      salesMap[name].units += item.quantity;
    });

    let bestSeller = '—';
    let mostUnitsSold = '—';
    let maxRevenue = 0;
    let maxUnits = 0;
    for (const [name, stats] of Object.entries(salesMap)) {
      if (stats.revenue > maxRevenue) { maxRevenue = stats.revenue; bestSeller = name; }
      if (stats.units > maxUnits) { maxUnits = stats.units; mostUnitsSold = name; }
    }

    // Average price
    const { data: priceData } = await supabase
      .from('products')
      .select('price')
      .eq('is_active', true);
    const avgPrice = priceData?.length
      ? priceData.reduce((s, p) => s + Number(p.price), 0) / priceData.length
      : 0;

    return {
      data: { totalRevenue, totalOrders, totalProducts, totalCustomers, bestSeller, mostUnitsSold, avgPrice },
      error: null,
    };
  },

  /**
   * Sales summary per product (for bar chart).
   */
  async getProductSalesSummary() {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('quantity, unit_price, products(name)');

    if (error) return { data: null, error };

    const map = {};
    (items || []).forEach(item => {
      const name = item.products?.name || 'Unknown';
      if (!map[name]) map[name] = { product: name, totalSales: 0, unitsSold: 0 };
      map[name].totalSales += item.quantity * Number(item.unit_price);
      map[name].unitsSold += item.quantity;
    });

    return { data: Object.values(map).sort((a, b) => b.totalSales - a.totalSales).slice(0, 10), error: null };
  },

  /**
   * Revenue share by category (for pie chart).
   */
  async getCategoryRevenueShare() {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('quantity, unit_price, products(categories(name))');

    if (error) return { data: null, error };

    const map = {};
    let total = 0;
    (items || []).forEach(item => {
      const catName = item.products?.categories?.name || 'Other';
      const revenue = item.quantity * Number(item.unit_price);
      if (!map[catName]) map[catName] = { category: catName, revenue: 0 };
      map[catName].revenue += revenue;
      total += revenue;
    });

    const result = Object.values(map).map(c => ({
      ...c,
      percentage: total > 0 ? ((c.revenue / total) * 100).toFixed(1) : 0,
    }));

    return { data: result.sort((a, b) => b.revenue - a.revenue), error: null };
  },

  /**
   * Units sold per product (for horizontal bar chart).
   */
  async getUnitsSoldByProduct() {
    const { data: items, error } = await supabase
      .from('order_items')
      .select('quantity, products(name)');

    if (error) return { data: null, error };

    const map = {};
    (items || []).forEach(item => {
      const name = item.products?.name || 'Unknown';
      if (!map[name]) map[name] = { product: name, unitsSold: 0 };
      map[name].unitsSold += item.quantity;
    });

    return { data: Object.values(map).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 10), error: null };
  },

  /**
   * Monthly sales trend.
   */
  async getMonthlySalesTrend(months = 6) {
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('total_amount, order_date, status')
      .gte('order_date', since.toISOString())
      .neq('status', 'cancelled')
      .order('order_date');

    if (error) return { data: null, error };

    const map = {};
    (orders || []).forEach(o => {
      const month = new Date(o.order_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
      if (!map[month]) map[month] = { month, revenue: 0, orders: 0 };
      map[month].revenue += Number(o.total_amount);
      map[month].orders += 1;
    });

    return { data: Object.values(map), error: null };
  },

  /**
   * Recent orders for dashboard feed.
   */
  async getRecentOrders(limit = 5) {
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, total_amount, status, order_date, customers(full_name)')
      .order('order_date', { ascending: false })
      .limit(limit);
    return { data, error };
  },
};
