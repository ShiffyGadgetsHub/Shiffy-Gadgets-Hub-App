import { useMemo, useState } from 'react';
import { AlertCircle, Wallet, Clock, Users, Search, WalletCards, Undo2, Eye } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, formatDateTime, pendingDuration } from '../lib/format';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Badge, { conditionTone, paymentStatusTone, simTypeTone } from '../components/ui/Badge';
import ProductIcon from '../components/ui/ProductIcon';
import ActionMenu from '../components/ui/ActionMenu';
import EmptyState from '../components/ui/EmptyState';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import RecordPaymentModal from '../components/inventory/RecordPaymentModal';
import type { Transaction } from '../types';

export default function OutstandingPage() {
  const transactions = useInventoryStore((s) => s.transactions);
  const returnItem = useInventoryStore((s) => s.returnItem);
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);
  const user = useAuthStore((s) => s.currentUser());

  const [search, setSearch] = useState('');
  const [paymentTxn, setPaymentTxn] = useState<Transaction | null>(null);
  const [returnTarget, setReturnTarget] = useState<Transaction | null>(null);

  const outstanding = useMemo(() => transactions.filter((t) => t.status === 'with_customer'), [transactions]);

  const stats = useMemo(() => {
    const balance = outstanding.reduce((sum, t) => sum + (t.totalAmount - t.amountPaid), 0);
    const unpaid = outstanding.filter((t) => t.paymentStatus === 'unpaid').length;
    const partial = outstanding.filter((t) => t.paymentStatus === 'partial').length;
    return { count: outstanding.length, balance, unpaid, partial };
  }, [outstanding]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return outstanding
      .filter((t) => !q || t.itemName.toLowerCase().includes(q) || t.customerName.toLowerCase().includes(q) || t.receiptNo.toLowerCase().includes(q))
      .sort((a, b) => a.takenDate.localeCompare(b.takenDate));
  }, [outstanding, search]);

  return (
    <div className="space-y-5">
      <PageHeader title="Outstanding" subtitle="Every item out with a customer that still has a balance owing." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Outstanding Deals" value={stats.count} icon={Clock} tone="amber" />
        <StatCard label="Outstanding Balance" value={formatCurrency(stats.balance, currencySymbol)} icon={Wallet} tone="rose" />
        <StatCard label="Fully Unpaid" value={stats.unpaid} icon={AlertCircle} tone="rose" />
        <StatCard label="Partially Paid" value={stats.partial} icon={WalletCards} tone="pink" />
      </div>

      <Card>
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search item, customer or receipt no…"
            className="h-10 w-full rounded-lg border border-line bg-surface-soft pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-400"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="Nothing outstanding" message="Every item taken out has been fully paid or returned." />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-line bg-surface text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-semibold">Item</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Taken</th>
                  <th className="px-5 py-3 font-semibold">Paid / Total</th>
                  <th className="px-5 py-3 font-semibold">Balance</th>
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
                            {t.itemSimType && <Badge tone={simTypeTone(t.itemSimType)}>{t.itemSimType}</Badge>}
                            <span className="text-xs text-ink-faint">{t.itemCategory}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {t.customerName}
                      {t.customerPhone && <p className="text-xs text-ink-faint">{t.customerPhone}</p>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {formatDateTime(t.takenDate)}
                      <p className="text-xs font-medium text-amber-600">Outstanding {pendingDuration(t.takenDate)}</p>
                    </td>
                    <td className="px-5 py-3 text-ink">
                      {formatCurrency(t.amountPaid, currencySymbol)}
                      <span className="text-ink-faint"> / {formatCurrency(t.totalAmount, currencySymbol)}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-rose-600">{formatCurrency(t.totalAmount - t.amountPaid, currencySymbol)}</td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge tone="amber">Outstanding</Badge>
                        <Badge tone={paymentStatusTone(t.paymentStatus)}>{t.paymentStatus === 'partial' ? 'Partial payment' : 'Unpaid'}</Badge>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{t.staffName}</td>
                    <td className="px-5 py-3 text-right">
                      <ActionMenu
                        items={[
                          { label: 'View invoice', icon: Eye, onClick: () => window.open(`/receipt/${t.id}`, '_blank') },
                          { label: 'Record payment', icon: Wallet, onClick: () => setPaymentTxn(t) },
                          { label: 'Return item', icon: Undo2, onClick: () => setReturnTarget(t) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

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
