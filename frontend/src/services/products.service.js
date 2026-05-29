import { supabase } from '../config/supabase.js';

export const ProductsService = {
  async getAll({ category = null, search = null, page = 1, limit = 12, active = true } = {}) {
    let query = supabase
      .from('products')
      .select('*, categories(id, name, slug)', { count: 'exact' });

    if (active !== null) query = query.eq('is_active', active);
    if (category) query = query.eq('category_id', category);
    if (search) query = query.ilike('name', `%${search}%`);

    const from = (page - 1) * limit;
    query = query.range(from, from + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    return { data, error, count };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(id, name, slug)')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    return { data, error };
  },

  async create(product) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select('*, categories(id, name, slug)');
    return { data: data?.[0], error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select('*, categories(id, name, slug)');
    return { data: data?.[0], error };
  },

  async toggleActive(id, isActive) {
    return this.update(id, { is_active: isActive });
  },

  async delete(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    return { error };
  },

  async uploadImage(file) {
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`;
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(`products/${fileName}`, file, {
        cacheControl: '3600',
        upsert: false,
      });
    if (error) return { url: null, error };
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(`products/${fileName}`);
    return { url: publicUrl, error: null };
  },

  subscribeToChanges(callback) {
    return supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, callback)
      .subscribe();
  },
};
