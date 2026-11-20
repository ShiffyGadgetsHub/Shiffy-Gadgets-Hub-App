import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Boxes, Clock, Wallet, TrendingUp, ArrowRight } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useInventoryStore } from '../store/inventoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDateTime } from '../lib/format';
import { getDashboardStats, getLowStock, buildSalesSeries, type SalesRange } from '../lib/stats';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge, { paymentStatusTone } from '../components/ui/Badge';
import ProductIcon from '../components/ui/ProductIcon';
import FilterSelect from '../components/ui/FilterSelect';
import NewYearPromptModal from '../components/settings/NewYearPromptModal';
import { useBasePath, useIsStaffView } from '../lib/useBasePath';

const AREA_COLOR = '#0a6cff';
const USED_COLOR = '#ec3fdc';

export default function DashboardPage() {
  const items = useInventoryStore((s) => s.items);
  const transactions = useInventoryStore((s) => s.transactions);
  const settings = useSettingsStore((s) => s.settings);
  const user = useAuthStore((s) => s.currentUser());
  const base = useBasePath();
  const isStaff = useIsStaffView();
  const [range, setRange] = useState<SalesRange>('daily');

  const stats = useMemo(
    () => getDashboardStats(items, transactions, settings.salesResetAt),
    [items, transactions, settings.salesResetAt]
  );
  const lowStock = useMemo(() => getLowStock(items, settings.lowStockThreshold), [items, settings.lowStockThreshold]);
  const series = useMemo(() => buildSalesSeries(transactions, range, isStaff ? 'count' : 'amount'), [transactions, range, isStaff]);
  const newVsUsed = useMemo(() => {
    const inStock = items.filter((i) => i.status === 'in_stock');
    return [
      { name: 'New', value: inStock.filter((i) => i.condition === 'New').length },
      { name: 'Used', value: inStock.filter((i) => i.condition === 'Used').length },
    ];
  }, [items]);
  const totalInStock = newVsUsed[0].value + newVsUsed[1].value;

  const recent = isStaff ? transactions.filter((t) => t.staffName === user?.name) : transactions;

  return (
    <div className="space-y-5">
      {!isStaff && <NewYearPromptModal />}
      <Card className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-brand-600 to-brand-700 text-white">
        <div>
          <p className="text-base font-semibold sm:text-lg">
            Hi {user?.name?.split(' ')[0] ?? 'there'}, welcome back 👋
          </p>
          <p className="mt-0.5 text-sm text-white/80">Here's what's happening with {settings.storeName} today.</p>
        </div>
        <p className="text-xs font-medium text-white/70">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </Card>

      <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isStaff ? 'xl:grid-cols-3' : 'xl:grid-cols-4'}`}>
        <StatCard label="Items in Stock" value={stats.itemsInStock} sublabel={`${stats.newInStock} New · ${stats.usedInStock} Used`} icon={Boxes} tone="brand" />
        <StatCard label="Out / Outstanding Return" value={stats.outPending} sublabel={`${stats.outPending} active transaction${stats.outPending === 1 ? '' : 's'}`} icon={Clock} tone="amber" />
        <StatCard label="Outstanding Balance" value={formatCurrency(stats.outstandingBalance, settings.currencySymbol)} sublabel="Unpaid + part-paid items" icon={Wallet} tone="rose" />
        {!isStaff && (
          <StatCard
            label="Total Sales"
            value={formatCurrency(stats.totalSales, settings.currencySymbol)}
            sublabel={
              settings.salesResetAt
                ? `Reset on ${new Date(settings.salesResetAt).toLocaleDateString()} — restore anytime in Settings`
                : `Stock on hand worth ${formatCurrency(stats.stockWorth, settings.currencySymbol)}`
            }
            icon={TrendingUp}
            tone="emerald"
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2" padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Recent Activities</h2>
            {!isStaff && (
              <Link to={`${base}/transactions`} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            )}
          </div>
          <div className="max-h-[420px] overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-line">
                {recent.map((t) => (
                  <tr key={t.id}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductIcon category={t.itemCategory} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{t.itemName}</p>
                          <p className="text-xs text-ink-faint">{t.itemCondition} · {formatDateTime(t.takenDate)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{t.customerName}</td>
                    <td className="px-5 py-3">
                      <Badge tone={t.status === 'returned' ? 'blue' : paymentStatusTone(t.paymentStatus)}>
                        {t.status === 'returned' ? 'Returned' : t.paymentStatus === 'paid' ? 'Paid' : t.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-right text-ink">
                      {formatCurrency(t.amountPaid, settings.currencySymbol)}
                      <span className="text-ink-faint"> / {formatCurrency(t.totalAmount, settings.currencySymbol)}</span>
                    </td>
                  </tr>
                ))}
                {recent.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-ink-faint">
                      No activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">Low Stock</h2>
            <Link to={`${base}/stock`} className="flex items-center gap-1 text-xs font-medium text-brand-500 hover:underline">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="max-h-[420px] divide-y divide-line overflow-y-auto">
            {lowStock.map((g) => (
              <div key={g.key} className="flex items-center gap-3 px-5 py-3">
                <ProductIcon category={g.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{g.name}</p>
                  <p className="text-xs text-ink-faint">{g.condition}</p>
                </div>
                <Badge tone={g.count <= 1 ? 'red' : 'amber'}>{g.count} left</Badge>
              </div>
            ))}
            {lowStock.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">Stock levels look healthy.</p>}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">{isStaff ? 'Sales Activity' : 'Sales Analytics'}</h2>
            <FilterSelect value={range} onChange={(e) => setRange(e.target.value as SalesRange)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </FilterSelect>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={series} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={AREA_COLOR} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={AREA_COLOR} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--line)" />
              <XAxis dataKey="label" stroke="var(--ink-faint)" tick={{ fill: 'var(--ink-faint)', fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'var(--line)' }} />
              <YAxis
                stroke="var(--ink-faint)"
                tick={{ fill: 'var(--ink-faint)', fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={56}
                allowDecimals={isStaff ? false : undefined}
                tickFormatter={(v) => (isStaff ? String(v) : v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}k` : String(v))}
              />
              <Tooltip
                contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12, color: 'var(--ink)' }}
                formatter={(value) => (isStaff ? [`${value} sold`, 'Units'] : [formatCurrency(Number(value), settings.currencySymbol), 'Sales'])}
              />
              <Area type="monotone" dataKey="total" stroke={AREA_COLOR} strokeWidth={2.5} fill="url(#salesFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h2 className="mb-4 text-sm font-semibold text-ink">New vs Used (in stock)</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={newVsUsed}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={totalInStock > 0 ? 3 : 0}
                stroke="var(--surface-raised)"
                strokeWidth={2}
              >
                <Cell fill={AREA_COLOR} />
                <Cell fill={USED_COLOR} />
              </Pie>
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                formatter={(value) => {
                  const entry = newVsUsed.find((d) => d.name === value);
                  return <span style={{ color: 'var(--ink-soft)', fontSize: 12 }}>{value} ({entry?.value ?? 0})</span>;
                }}
              />
              <Tooltip contentStyle={{ background: 'var(--surface-raised)', border: '1px solid var(--line)', borderRadius: 10, fontSize: 12, color: 'var(--ink)' }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
