import type { InventoryItem, Transaction } from '../types';

export type SalesRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface SalesPoint {
  label: string;
  total: number;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function mondayOf(d: Date): Date {
  const x = startOfDay(d);
  const day = x.getDay(); // 0 Sun .. 6 Sat
  const offset = day === 0 ? 6 : day - 1;
  return addDays(x, -offset);
}

export function buildSalesSeries(transactions: Transaction[], range: SalesRange, metric: 'amount' | 'count' = 'amount'): SalesPoint[] {
  const completed = transactions.filter((t) => t.status === 'completed' && t.completedDate);
  const valueOf = (t: Transaction) => (metric === 'count' ? 1 : t.totalAmount);

  if (range === 'daily') {
    const weekStart = mondayOf(new Date());
    const days: SalesPoint[] = Array.from({ length: 7 }).map((_, i) => ({
      label: addDays(weekStart, i).toLocaleDateString(undefined, { weekday: 'short' }),
      total: 0,
    }));
    for (const t of completed) {
      const d = startOfDay(new Date(t.completedDate!));
      const diffDays = Math.round((d.getTime() - weekStart.getTime()) / 86400000);
      if (diffDays >= 0 && diffDays < 7) days[diffDays].total += valueOf(t);
    }
    return days;
  }

  if (range === 'weekly') {
    const thisWeekStart = mondayOf(new Date());
    const weeks: SalesPoint[] = Array.from({ length: 8 }).map((_, i) => ({
      label: addDays(thisWeekStart, (i - 7) * 7).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      total: 0,
    }));
    for (const t of completed) {
      const d = startOfDay(new Date(t.completedDate!));
      const diffDays = Math.round((d.getTime() - thisWeekStart.getTime()) / 86400000);
      const weekIdx = 7 + Math.floor(diffDays / 7);
      if (weekIdx >= 0 && weekIdx < 8) weeks[weekIdx].total += valueOf(t);
    }
    return weeks;
  }

  if (range === 'monthly') {
    const months: SalesPoint[] = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ label: d.toLocaleDateString(undefined, { month: 'short' }), total: 0 });
    }
    for (const t of completed) {
      const d = new Date(t.completedDate!);
      const monthsAgo = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
      const idx = 11 - monthsAgo;
      if (idx >= 0 && idx < 12) months[idx].total += valueOf(t);
    }
    return months;
  }

  // yearly
  const now = new Date();
  const years: SalesPoint[] = Array.from({ length: 5 }).map((_, i) => ({
    label: String(now.getFullYear() - 4 + i),
    total: 0,
  }));
  for (const t of completed) {
    const y = new Date(t.completedDate!).getFullYear();
    const idx = y - (now.getFullYear() - 4);
    if (idx >= 0 && idx < 5) years[idx].total += valueOf(t);
  }
  return years;
}

export function getItemsInStock(items: InventoryItem[]) {
  return items.filter((i) => i.status === 'in_stock');
}

export function getPendingTransactions(transactions: Transaction[]) {
  return transactions.filter((t) => t.status === 'with_customer');
}

export function getOutstandingBalance(transactions: Transaction[]) {
  return getPendingTransactions(transactions).reduce((sum, t) => sum + (t.totalAmount - t.amountPaid), 0);
}

export function getCompletedTransactions(transactions: Transaction[]) {
  return transactions.filter((t) => t.status === 'completed');
}

export function getTotalSales(transactions: Transaction[], resetAt?: string) {
  const completed = getCompletedTransactions(transactions);
  const counted = resetAt ? completed.filter((t) => (t.completedDate ?? '') > resetAt) : completed;
  return counted.reduce((sum, t) => sum + t.totalAmount, 0);
}

export function getStockWorth(items: InventoryItem[]) {
  return getItemsInStock(items).reduce((sum, i) => sum + i.sellingPrice, 0);
}

export function getProfit(items: InventoryItem[], transactions: Transaction[]) {
  const byId = new Map(items.map((i) => [i.id, i]));
  return getCompletedTransactions(transactions).reduce((sum, t) => {
    const item = byId.get(t.itemId);
    const cost = item?.costPrice ?? 0;
    return sum + (t.totalAmount - cost);
  }, 0);
}

export function getDashboardStats(items: InventoryItem[], transactions: Transaction[], salesResetAt?: string) {
  const inStock = getItemsInStock(items);
  const pending = getPendingTransactions(transactions);
  return {
    itemsInStock: inStock.length,
    newInStock: inStock.filter((i) => i.condition === 'New').length,
    usedInStock: inStock.filter((i) => i.condition === 'Used').length,
    outPending: pending.length,
    outstandingBalance: getOutstandingBalance(transactions),
    totalSales: getTotalSales(transactions, salesResetAt),
    stockWorth: getStockWorth(items),
    itemsSold: getCompletedTransactions(transactions).length,
    profit: getProfit(items, transactions),
  };
}

export function getItemTransaction(transactions: Transaction[], itemId: string): Transaction | undefined {
  const forItem = transactions.filter((t) => t.itemId === itemId);
  return (
    forItem.find((t) => t.status === 'with_customer') ??
    forItem.find((t) => t.status === 'completed') ??
    forItem[0]
  );
}

export function sortInventoryForDisplay(items: InventoryItem[], transactions: Transaction[]): InventoryItem[] {
  const weight = (item: InventoryItem) => (item.status === 'out' ? 0 : item.status === 'in_stock' ? 1 : 2);
  return [...items].sort((a, b) => {
    const w = weight(a) - weight(b);
    if (w !== 0) return w;
    if (a.status === 'out' && b.status === 'out') {
      const ta = getItemTransaction(transactions, a.id)?.takenDate ?? '';
      const tb = getItemTransaction(transactions, b.id)?.takenDate ?? '';
      return ta.localeCompare(tb); // oldest pending first — needs attention soonest
    }
    return b.dateAdded.localeCompare(a.dateAdded);
  });
}

export interface LowStockGroup {
  key: string;
  name: string;
  category: string;
  condition: 'New' | 'Used';
  count: number;
}

export interface KnownCustomer {
  name: string;
  phone: string;
  lastDate: string;
}

export function getKnownCustomers(transactions: Transaction[]): KnownCustomer[] {
  const map = new Map<string, KnownCustomer>();
  for (const t of transactions) {
    if (!t.customerPhone) continue;
    const key = t.customerName.trim().toLowerCase();
    if (!key) continue;
    const existing = map.get(key);
    if (!existing || t.takenDate > existing.lastDate) {
      map.set(key, { name: t.customerName, phone: t.customerPhone, lastDate: t.takenDate });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export function getLowStock(items: InventoryItem[], threshold: number): LowStockGroup[] {
  const map = new Map<string, LowStockGroup>();
  for (const item of getItemsInStock(items)) {
    const key = `${item.name}__${item.condition}`;
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { key, name: item.name, category: item.category, condition: item.condition, count: 1 });
  }
  return Array.from(map.values())
    .filter((g) => g.count <= threshold)
    .sort((a, b) => a.count - b.count);
}
