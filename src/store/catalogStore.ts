import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/id';
import { SEED_CATEGORIES, SEED_BRANDS, SEED_ITEM_NAMES, COLOR_PALETTE, categoryToSlug } from '../data/catalog';
import type { BrandRecord, CategoryRecord, ItemNameRecord } from '../types';

interface CatalogState {
  categories: CategoryRecord[];
  brands: BrandRecord[];
  itemNames: ItemNameRecord[];
  colors: string[];
  seeded: boolean;

  seedIfEmpty: () => void;
  syncLatestCatalog: () => void;

  addCategory: (name: string) => { ok: boolean; error?: string };
  updateCategory: (id: string, patch: Partial<Pick<CategoryRecord, 'name' | 'active'>>) => void;
  deleteCategory: (id: string) => void;

  addBrand: (category: string, name: string) => { ok: boolean; error?: string };
  deleteBrand: (id: string) => void;

  addItemName: (category: string, brand: string, name: string) => { ok: boolean; error?: string };
  deleteItemName: (id: string) => void;

  brandsFor: (category: string) => string[];
  itemNamesFor: (category: string, brand: string) => string[];
  searchItemNames: (query: string) => ItemNameRecord[];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      categories: [],
      brands: [],
      itemNames: [],
      colors: COLOR_PALETTE.map((c) => c.name),
      seeded: false,

      seedIfEmpty: () => {
        if (get().seeded && get().categories.length > 0) return;

        const categories: CategoryRecord[] = SEED_CATEGORIES.map((name, i) => ({
          id: generateId('cat'),
          name,
          slug: categoryToSlug(name),
          createdOn: daysAgo(90 - i * 4),
          active: true,
        }));

        const brands: BrandRecord[] = Object.entries(SEED_BRANDS).flatMap(([category, names]) =>
          names.map((name) => ({ id: generateId('brd'), category, name }))
        );

        const itemNames: ItemNameRecord[] = SEED_ITEM_NAMES.map((seed, i) => ({
          id: generateId('itn'),
          category: seed.category,
          brand: seed.brand,
          name: seed.name,
          createdOn: daysAgo(90 - (i % 80)),
        }));

        set({ categories, brands, itemNames, seeded: true });
      },

      // Tops up a previously-seeded catalog with any new default models added
      // to the app since (e.g. a newly released phone), without touching or
      // duplicating anything the admin has already customized.
      syncLatestCatalog: () => {
        if (!get().seeded) return;

        const existingBrandKeys = new Set(get().brands.map((b) => `${b.category}__${b.name.toLowerCase()}`));
        const newBrands: BrandRecord[] = Object.entries(SEED_BRANDS)
          .flatMap(([category, names]) => names.map((name) => ({ category, name })))
          .filter(({ category, name }) => !existingBrandKeys.has(`${category}__${name.toLowerCase()}`))
          .map(({ category, name }) => ({ id: generateId('brd'), category, name }));

        const existingItemKeys = new Set(
          get().itemNames.map((n) => `${n.category}__${n.brand}__${n.name.toLowerCase()}`)
        );
        const newItemNames: ItemNameRecord[] = SEED_ITEM_NAMES.filter(
          (s) => !existingItemKeys.has(`${s.category}__${s.brand}__${s.name.toLowerCase()}`)
        ).map((s) => ({ id: generateId('itn'), category: s.category, brand: s.brand, name: s.name, createdOn: new Date().toISOString() }));

        if (newBrands.length === 0 && newItemNames.length === 0) return;

        set({
          brands: [...get().brands, ...newBrands],
          itemNames: [...newItemNames, ...get().itemNames],
        });
      },

      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: 'Category name is required' };
        if (get().categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
          return { ok: false, error: 'That category already exists' };
        }
        set({
          categories: [
            ...get().categories,
            { id: generateId('cat'), name: trimmed, slug: categoryToSlug(trimmed), createdOn: new Date().toISOString(), active: true },
          ],
        });
        return { ok: true };
      },

      updateCategory: (id, patch) => {
        set({
          categories: get().categories.map((c) => (c.id === id ? { ...c, ...patch, slug: patch.name ? categoryToSlug(patch.name) : c.slug } : c)),
        });
      },

      deleteCategory: (id) => {
        const cat = get().categories.find((c) => c.id === id);
        set({
          categories: get().categories.filter((c) => c.id !== id),
          brands: cat ? get().brands.filter((b) => b.category !== cat.name) : get().brands,
          itemNames: cat ? get().itemNames.filter((n) => n.category !== cat.name) : get().itemNames,
        });
      },

      addBrand: (category, name) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: 'Brand name is required' };
        if (get().brands.some((b) => b.category === category && b.name.toLowerCase() === trimmed.toLowerCase())) {
          return { ok: false, error: 'That brand already exists in this category' };
        }
        set({ brands: [...get().brands, { id: generateId('brd'), category, name: trimmed }] });
        return { ok: true };
      },

      deleteBrand: (id) => {
        const brand = get().brands.find((b) => b.id === id);
        set({
          brands: get().brands.filter((b) => b.id !== id),
          itemNames: brand ? get().itemNames.filter((n) => !(n.category === brand.category && n.brand === brand.name)) : get().itemNames,
        });
      },

      addItemName: (category, brand, name) => {
        const trimmed = name.trim();
        if (!trimmed) return { ok: false, error: 'Item name is required' };
        if (get().itemNames.some((n) => n.category === category && n.brand === brand && n.name.toLowerCase() === trimmed.toLowerCase())) {
          return { ok: false, error: 'That item name already exists' };
        }
        set({
          itemNames: [
            { id: generateId('itn'), category, brand, name: trimmed, createdOn: new Date().toISOString() },
            ...get().itemNames,
          ],
        });
        return { ok: true };
      },

      deleteItemName: (id) => {
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
    }),
    { name: 'gadgetstock-catalog' }
  )
);
