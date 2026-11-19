import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Wallet, LineChart, Boxes, Search, Download, Wallet as WalletIcon, Undo2, Receipt } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCatalogStore } from '../store/catalogStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDateTime, pendingDuration } from '../lib/format';
import { getOutstandingBalance, getTotalSales, getProfit, getStockWorth } from '../lib/stats';
import { exportToExcel } from '../lib/export';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import FilterSelect from '../components/ui/FilterSelect';
import Button from '../components/ui/Button';
import Badge, { transactionStatusTone, conditionTone } from '../components/ui/Badge';
import ProductIcon from '../components/ui/ProductIcon';
import ActionMenu from '../components/ui/ActionMenu';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RecordPaymentModal from '../components/inventory/RecordPaymentModal';
import type { Transaction } from '../types';

const STATUS_LABEL: Record<string, string> = { with_customer: 'Outstanding', returned: 'Returned', completed: 'Completed' };

export default function TransactionsPage() {
  const navigate = useNavigate();
  const items = useInventoryStore((s) => s.items);
  const transactions = useInventoryStore((s) => s.transactions);
  const returnItem = useInventoryStore((s) => s.returnItem);
  const categories = useCatalogStore((s) => s.categories);
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);
  const user = useAuthStore((s) => s.currentUser());

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [condition, setCondition] = useState('All');
  const [category, setCategory] = useState('All');
  const [paymentTxn, setPaymentTxn] = useState<Transaction | null>(null);
  const [returnTarget, setReturnTarget] = useState<Transaction | null>(null);

  const stats = useMemo(
    () => ({
      totalSales: getTotalSales(transactions),
      outstanding: getOutstandingBalance(transactions),
      profit: getProfit(items, transactions),
      stockWorth: getStockWorth(items),
    }),
    [items, transactions]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions
      .filter((t) => {
        if (status !== 'All' && t.status !== status) return false;
        if (condition !== 'All' && t.itemCondition !== condition) return false;
        if (category !== 'All' && t.itemCategory !== category) return false;
        if (!q) return true;
        return t.itemName.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.receiptNo.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const weight = (t: Transaction) => (t.status === 'with_customer' ? 0 : 1);
        return weight(a) - weight(b) || b.takenDate.localeCompare(a.takenDate);
      });
  }, [transactions, search, status, condition, category]);

  function handleExport() {
    exportToExcel(
      'gadgetstock-transactions',
      'Transactions',
      filtered.map((t) => ({
        Item: t.itemName,
        Condition: t.itemCondition,
        Category: t.itemCategory,
        Customer: t.customerName,
        'Taken Date': formatDateTime(t.takenDate),
        Paid: t.amountPaid,
        Total: t.totalAmount,
        Status: STATUS_LABEL[t.status],
        Staff: t.staffName,
      }))
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Transaction" subtitle="Every sale, release and return — with running balances." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Sales" value={formatCurrency(stats.totalSales, currencySymbol)} icon={TrendingUp} tone="emerald" />
        <StatCard label="Outstanding Balance" value={formatCurrency(stats.outstanding, currencySymbol)} icon={Wallet} tone="rose" />
        <StatCard label="Profit" value={formatCurrency(stats.profit, currencySymbol)} icon={LineChart} tone="brand" />
        <StatCard label="Stock on hand worth" value={formatCurrency(stats.stockWorth, currencySymbol)} icon={Boxes} tone="violet" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search item, customer or receipt no…"
              className="h-10 w-full rounded-lg border border-line bg-surface-soft pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-400"
            />
          </div>
          <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="with_customer">Outstanding</option>
            <option value="completed">Completed</option>
            <option value="returned">Returned</option>
          </FilterSelect>
          <FilterSelect value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="All">All Conditions</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </FilterSelect>
          <FilterSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </FilterSelect>
          <Button variant="outline" icon={<Download size={15} />} onClick={handleExport} className="ml-auto">
            Export
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line bg-surface text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3 font-semibold">Item</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Taken</th>
                <th className="px-5 py-3 font-semibold">Paid / Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Staff</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((t) => (
                <tr key={t.id} className="hover:bg-surface/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <ProductIcon category={t.itemCategory} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{t.itemName}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Badge tone={conditionTone(t.itemCondition)}>{t.itemCondition}</Badge>
                          <span className="text-xs text-ink-faint">{t.itemCategory}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{t.customerName}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {formatDateTime(t.takenDate)}
                    {t.status === 'with_customer' && <p className="text-xs font-medium text-amber-600">Outstanding {pendingDuration(t.takenDate)}</p>}
                  </td>
                  <td className="px-5 py-3 text-ink">
                    {formatCurrency(t.amountPaid, currencySymbol)}
                    <span className="text-ink-faint"> / {formatCurrency(t.totalAmount, currencySymbol)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={transactionStatusTone(t.status)}>{STATUS_LABEL[t.status]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{t.staffName}</td>
                  <td className="px-5 py-3 text-right">
                    {t.status === 'with_customer' ? (
                      <ActionMenu
                        items={[
                          { label: 'Record payment', icon: WalletIcon, onClick: () => setPaymentTxn(t) },
                          { label: 'Return item', icon: Undo2, onClick: () => setReturnTarget(t) },
                        ]}
                      />
                    ) : t.status === 'completed' ? (
                      <ActionMenu items={[{ label: 'Generate receipt', icon: Receipt, onClick: () => navigate(`/receipt/${t.id}`) }]} />
                    ) : (
                      <span className="text-xs text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-ink-faint">No transactions found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <RecordPaymentModal transaction={paymentTxn} onClose={() => setPaymentTxn(null)} />
      <ConfirmDialog
        open={!!returnTarget}
        title="Return item"
        message={`Are you sure ${returnTarget?.customerName} is returning "${returnTarget?.itemName}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => setReturnTarget(null)}
        onConfirm={() => {
          if (returnTarget) returnItem(returnTarget.id, user?.name ?? 'Staff');
          setReturnTarget(null);
        }}
      />
    </div>
  );
}
