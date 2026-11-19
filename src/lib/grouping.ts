import type { InventoryItem } from '../types';

export interface StockGroup {
  key: string;
  name: string;
  category: string;
  brand: string;
  condition: 'New' | 'Used';
  count: number;
  totalValue: number;
}

export function groupStock(items: InventoryItem[]): StockGroup[] {
  const map = new Map<string, StockGroup>();
  for (const item of items) {
    const key = `${item.name.toLowerCase()}__${item.condition}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      existing.totalValue += item.sellingPrice;
    } else {
      map.set(key, {
        key,
        name: item.name,
        category: item.category,
        brand: item.brand,
        condition: item.condition,
        count: 1,
        totalValue: item.sellingPrice,
      });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}
