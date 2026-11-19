import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { COLOR_PALETTE, categoryToSlug } from '../data/catalog';
import type { BrandRecord, CategoryRecord, ItemNameRecord } from '../types';

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  created_on: string;
}
interface BrandRow {
  id: string;
  category: string;
  name: string;
}
interface ItemNameRow {
  id: string;
  category: string;
  brand: string;
  name: string;
  created_on: string;
}

function mapCategory(r: CategoryRow): CategoryRecord {
  return { id: r.id, name: r.name, slug: r.slug, createdOn: r.created_on, active: r.active };
}
function mapBrand(r: BrandRow): BrandRecord {
  return { id: r.id, category: r.category, name: r.name };
}
function mapItemName(r: ItemNameRow): ItemNameRecord {
  return { id: r.id, category: r.category, brand: r.brand, name: r.name, createdOn: r.created_on };
}

interface CatalogState {
  categories: CategoryRecord[];
  brands: BrandRecord[];
  itemNames: ItemNameRecord[];
  colors: string[];
  loaded: boolean;

  loadAll: () => Promise<void>;

  addCategory: (name: string) => Promise<{ ok: boolean; error?: string }>;
  updateCategory: (id: string, patch: Partial<Pick<CategoryRecord, 'name' | 'active'>>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addBrand: (category: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  deleteBrand: (id: string) => Promise<void>;

  addItemName: (category: string, brand: string, name: string) => Promise<{ ok: boolean; error?: string }>;
  deleteItemName: (id: string) => Promise<void>;

  brandsFor: (category: string) => string[];
  itemNamesFor: (category: string, brand: string) => string[];
  searchItemNames: (query: string) => ItemNameRecord[];
}

export const useCatalogStore = create<CatalogState>()((set, get) => ({
  categories: [],
  brands: [],
  itemNames: [],
  colors: COLOR_PALETTE.map((c) => c.name),
  loaded: false,

  loadAll: async () => {
    const [catRes, brandRes, itemRes] = await Promise.all([
      supabase.from('categories').select('*').order('created_on', { ascending: true }),
      supabase.from('brands').select('*'),
      supabase.from('item_names').select('*'),
    ]);
    if (catRes.error || brandRes.error || itemRes.error) return;
    set({
      categories: (catRes.data as CategoryRow[]).map(mapCategory),
      brands: (brandRes.data as BrandRow[]).map(mapBrand),
      itemNames: (itemRes.data as ItemNameRow[]).map(mapItemName),
      loaded: true,
    });
  },

  addCategory: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Category name is required' };
    if (get().categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'That category already exists' };
    }
    const { data, error } = await supabase
      .from('categories')
      .insert({ name: trimmed, slug: categoryToSlug(trimmed) })
      .select()
      .single();
    if (error || !data) return { ok: false, error: error?.message ?? 'Could not add category' };
    set({ categories: [...get().categories, mapCategory(data as CategoryRow)] });
    return { ok: true };
  },

  updateCategory: async (id, patch) => {
    const dbPatch: Record<string, unknown> = { ...patch };
    if (patch.name) dbPatch.slug = categoryToSlug(patch.name);
    const { error } = await supabase.from('categories').update(dbPatch).eq('id', id);
    if (error) return;
    set({
      categories: get().categories.map((c) =>
        c.id === id ? { ...c, ...patch, slug: patch.name ? categoryToSlug(patch.name) : c.slug } : c
      ),
    });
  },

  deleteCategory: async (id) => {
    const cat = get().categories.find((c) => c.id === id);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return;
    set({
      categories: get().categories.filter((c) => c.id !== id),
      brands: cat ? get().brands.filter((b) => b.category !== cat.name) : get().brands,
      itemNames: cat ? get().itemNames.filter((n) => n.category !== cat.name) : get().itemNames,
    });
  },

  addBrand: async (category, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Brand name is required' };
    if (get().brands.some((b) => b.category === category && b.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'That brand already exists in this category' };
    }
    const { data, error } = await supabase.from('brands').insert({ category, name: trimmed }).select().single();
    if (error || !data) return { ok: false, error: error?.message ?? 'Could not add brand' };
    set({ brands: [...get().brands, mapBrand(data as BrandRow)] });
    return { ok: true };
  },

  deleteBrand: async (id) => {
    const brand = get().brands.find((b) => b.id === id);
    const { error } = await supabase.from('brands').delete().eq('id', id);
    if (error) return;
    set({
      brands: get().brands.filter((b) => b.id !== id),
      itemNames: brand ? get().itemNames.filter((n) => !(n.category === brand.category && n.brand === brand.name)) : get().itemNames,
    });
  },

  addItemName: async (category, brand, name) => {
    const trimmed = name.trim();
    if (!trimmed) return { ok: false, error: 'Item name is required' };
    if (get().itemNames.some((n) => n.category === category && n.brand === brand && n.name.toLowerCase() === trimmed.toLowerCase())) {
      return { ok: false, error: 'That item name already exists' };
    }
    const { data, error } = await supabase.from('item_names').insert({ category, brand, name: trimmed }).select().single();
    if (error || !data) return { ok: false, error: error?.message ?? 'Could not add item name' };
    set({ itemNames: [mapItemName(data as ItemNameRow), ...get().itemNames] });
    return { ok: true };
  },

  deleteItemName: async (id) => {
    const { error } = await supabase.from('item_names').delete().eq('id', id);
    if (error) return;
    set({ itemNames: get().itemNames.filter((n) => n.id !== id) });
  },

  brandsFor: (category) => get().brands.filter((b) => b.category === category).map((b) => b.name),

  itemNamesFor: (category, brand) =>
    get()
      .itemNames.filter((n) => n.category === category && n.brand === brand)
      .map((n) => n.name),

  searchItemNames: (query) => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return get()
      .itemNames.filter((n) => n.name.toLowerCase().includes(q))
      .slice(0, 20);
  },
}));
