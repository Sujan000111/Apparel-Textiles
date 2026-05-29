import { supabase } from '../config/supabase.js';

export const CustomersService = {
  async getAll({ search = null, page = 1, limit = 20 } = {}) {
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' });

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async getByAuthId(authUserId) {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('auth_user_id', authUserId)
      .single();
    return { data, error };
  },

  async create(customer) {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select();
    return { data: data?.[0], error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async getTopCustomers(limit = 10) {
    const { data, error } = await supabase
      .from('v_top_customers')
      .select('*')
      .limit(limit);
    return { data, error };
  },
};
