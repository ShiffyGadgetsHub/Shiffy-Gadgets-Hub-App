import type { InventoryItem, Transaction } from '../types';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface BreakdownRow {
  label: string;
  revenue: number;
  units: number;
}

export interface CustomerRow {
  name: string;
  phone?: string;
  revenue: number;
  units: number;
}

export interface StatusRow {
  label: string;
  count: number;
  value: number;
}

export interface YearStats {
  year: number;
  revenue: number;
  profit: number;
  profitMargin: number;
  unitsSold: number;
  avgSaleValue: number;
  newRevenue: number;
  newUnits: number;
  usedRevenue: number;
  usedUnits: number;
  monthly: BreakdownRow[];
  byCategory: BreakdownRow[];
  topItems: BreakdownRow[];
  topCustomers: CustomerRow[];
  staffLeaderboard: CustomerRow[];
  paymentStatus: StatusRow[];
  outstandingFromYear: number;
  returnedCount: number;
  returnedValue: number;
  bestMonth: BreakdownRow | null;
  worstMonth: BreakdownRow | null;
}

/** Every calendar year that has at least one transaction, newest first — plus the current year even if empty. */
export function getAvailableYears(transactions: Transaction[]): number[] {
  const years = new Set<number>([new Date().getFullYear()]);
  for (const t of transactions) {
    years.add(new Date(t.takenDate).getFullYear());
  }
  return Array.from(years).sort((a, b) => b - a);
}

function addToMap<T extends { revenue: number; units: number }>(map: Map<string, T>, key: string, make: () => T, revenue: number) {
  const existing = map.get(key);
  if (existing) {
    existing.revenue += revenue;
    existing.units += 1;
  } else {
    const row = make();
    row.revenue += revenue;
    row.units += 1;
    map.set(key, row);
  }
}

export function computeYearStats(items: InventoryItem[], transactions: Transaction[], year: number): YearStats {
  const costById = new Map(items.map((i) => [i.id, i.costPrice]));

  const takenInYear = transactions.filter((t) => new Date(t.takenDate).getFullYear() === year);
  const completedInYear = transactions.filter(
    (t) => t.status === 'completed' && t.completedDate && new Date(t.completedDate).getFullYear() === year
  );

  const revenue = completedInYear.reduce((sum, t) => sum + t.totalAmount, 0);
  const profit = completedInYear.reduce((sum, t) => sum + (t.totalAmount - (costById.get(t.itemId) ?? 0)), 0);
  const unitsSold = completedInYear.length;
  const avgSaleValue = unitsSold > 0 ? revenue / unitsSold : 0;
  const profitMargin = revenue > 0 ? (profit / revenue) * 100 : 0;

  const newTxns = completedInYear.filter((t) => t.itemCondition === 'New');
  const usedTxns = completedInYear.filter((t) => t.itemCondition === 'Used');

  const monthly: BreakdownRow[] = MONTH_LABELS.map((label) => ({ label, revenue: 0, units: 0 }));
  for (const t of completedInYear) {
    const m = new Date(t.completedDate!).getMonth();
    monthly[m].revenue += t.totalAmount;
    monthly[m].units += 1;
  }
  const monthsWithSales = monthly.filter((m) => m.units > 0);
  const bestMonth = monthsWithSales.length ? monthsWithSales.reduce((a, b) => (b.revenue > a.revenue ? b : a)) : null;
  const worstMonth = monthsWithSales.length ? monthsWithSales.reduce((a, b) => (b.revenue < a.revenue ? b : a)) : null;

  const categoryMap = new Map<string, BreakdownRow>();
  const itemMap = new Map<string, BreakdownRow>();
  const customerMap = new Map<string, CustomerRow>();
  const staffMap = new Map<string, CustomerRow>();

  for (const t of completedInYear) {
    addToMap(categoryMap, t.itemCategory, () => ({ label: t.itemCategory, revenue: 0, units: 0 }), t.totalAmount);
    addToMap(itemMap, t.itemName, () => ({ label: t.itemName, revenue: 0, units: 0 }), t.totalAmount);

    const custKey = `${t.customerName.trim().toLowerCase()}__${t.customerPhone ?? ''}`;
    addToMap(customerMap, custKey, () => ({ name: t.customerName, phone: t.customerPhone, revenue: 0, units: 0 }), t.totalAmount);

    addToMap(staffMap, t.staffName, () => ({ name: t.staffName, revenue: 0, units: 0 }), t.totalAmount);
  }

  const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.revenue - a.revenue);
  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const topCustomers = Array.from(customerMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);
  const staffLeaderboard = Array.from(staffMap.values()).sort((a, b) => b.revenue - a.revenue);

  const withCustomerInYear = takenInYear.filter((t) => t.status === 'with_customer');
  const returnedInYear = takenInYear.filter((t) => t.status === 'returned');
  const outstandingFromYear = withCustomerInYear.reduce((sum, t) => sum + (t.totalAmount - t.amountPaid), 0);

  const paymentStatus: StatusRow[] = [
    {
      label: 'Paid in full',
      count: completedInYear.length,
      value: completedInYear.reduce((s, t) => s + t.totalAmount, 0),
    },
    {
      label: 'Partially paid (with customer)',
      count: withCustomerInYear.filter((t) => t.paymentStatus === 'partial').length,
      value: withCustomerInYear.filter((t) => t.paymentStatus === 'partial').reduce((s, t) => s + t.totalAmount, 0),
    },
    {
      label: 'Unpaid (with customer)',
      count: withCustomerInYear.filter((t) => t.paymentStatus === 'unpaid').length,
      value: withCustomerInYear.filter((t) => t.paymentStatus === 'unpaid').reduce((s, t) => s + t.totalAmount, 0),
    },
    {
      label: 'Returned',
      count: returnedInYear.length,
      value: returnedInYear.reduce((s, t) => s + t.totalAmount, 0),
    },
  ];

  return {
    year,
    revenue,
    profit,
    profitMargin,
    unitsSold,
    avgSaleValue,
    newRevenue: newTxns.reduce((s, t) => s + t.totalAmount, 0),
    newUnits: newTxns.length,
    usedRevenue: usedTxns.reduce((s, t) => s + t.totalAmount, 0),
    usedUnits: usedTxns.length,
    monthly,
    byCategory,
    topItems,
    topCustomers,
    staffLeaderboard,
    paymentStatus,
    outstandingFromYear,
    returnedCount: returnedInYear.length,
    returnedValue: returnedInYear.reduce((s, t) => s + t.totalAmount, 0),
    bestMonth,
    worstMonth,
  };
}
