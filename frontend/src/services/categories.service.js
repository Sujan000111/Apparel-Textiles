import { supabase } from '../config/supabase.js';

export const CategoriesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(count)')
      .order('name');
    return { data, error };
  },

  async getById(id) {
    const { data, error } = await supabase
      .from('categories')
      .select('*, products(count)')
      .eq('id', id)
      .single();
    return { data, error };
  },

  async getBySlug(slug) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();
    return { data, error };
  },

  async create(category) {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select();
    return { data: data?.[0], error };
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async delete(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    return { error };
  },
};
