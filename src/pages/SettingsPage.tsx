import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Store,
  Users,
  Receipt,
  Camera,
  Eye,
  FileSpreadsheet,
  RotateCcw,
  Download,
  TrendingUp,
  Wallet,
  Package,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import logoMark from '../assets/logo-mark.png';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { useInventoryStore } from '../store/inventoryStore';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Avatar from '../components/ui/Avatar';
import StatCard from '../components/ui/StatCard';
import StaffAccountsPanel from '../components/settings/StaffAccountsPanel';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FieldWrap, Input, NumberInput, Select } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { parseNumberInput, formatCurrency, formatDateTime } from '../lib/format';
import { getCompletedTransactions } from '../lib/stats';
import { getAvailableYears, computeYearStats } from '../lib/yearStats';
import { downloadYearEndReport } from '../lib/yearEndReport';
import { useIsStaffView } from '../lib/useBasePath';

type Tab = 'general' | 'store' | 'staff' | 'receipt' | 'reports';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('general');
  const isStaff = useIsStaffView();
  const user = useAuthStore((s) => s.currentUser());
  const updateStaff = useAuthStore((s) => s.updateStaff);
  const settings = useSettingsStore((s) => s.settings);
  const updateSettings = useSettingsStore((s) => s.updateSettings);
  const resetTotalSales = useSettingsStore((s) => s.resetTotalSales);
  const restoreTotalSales = useSettingsStore((s) => s.restoreTotalSales);
  const items = useInventoryStore((s) => s.items);
  const transactions = useInventoryStore((s) => s.transactions);
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const availableYears = useMemo(() => getAvailableYears(transactions), [transactions]);
  const [reportYear, setReportYear] = useState(() => availableYears[0] ?? new Date().getFullYear());
  const reportStats = useMemo(() => computeYearStats(items, transactions, reportYear), [items, transactions, reportYear]);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  async function handleDownloadReport() {
    setGeneratingReport(true);
    try {
      await downloadYearEndReport(reportYear, items, transactions, settings.storeName, settings.currencySymbol);
    } finally {
      setGeneratingReport(false);
    }
  }

  const [profile, setProfile] = useState({
    username: user?.username ?? '',
    name: user?.name ?? '',
    position: user?.position ?? '',
    phone: user?.phone ?? '',
  });
  const [saved, setSaved] = useState(false);

  const [store, setStore] = useState({
    storeName: settings.storeName,
    lowStockThreshold: String(settings.lowStockThreshold),
  });
  const [receipt, setReceipt] = useState({
    storeName: settings.storeName,
    logo: settings.logo ?? '',
    address: settings.address,
    supportPhone: settings.supportPhone,
    supportPhone2: settings.supportPhone2 ?? '',
    supportEmail: settings.supportEmail,
    receiptFooter: settings.receiptFooter,
    bankName: settings.bankName ?? '',
    bankAccountNumber: settings.bankAccountNumber ?? '',
    bankAccountName: settings.bankAccountName ?? '',
  });

  const generatedReceipts = useMemo(
    () => getCompletedTransactions(transactions).sort((a, b) => (b.completedDate ?? '').localeCompare(a.completedDate ?? '')),
    [transactions]
  );

  function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const reader = new FileReader();
    reader.onload = () => updateStaff(user.id, { avatar: reader.result as string });
    reader.readAsDataURL(file);
  }

  function onLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setReceipt((r) => ({ ...r, logo: reader.result as string }));
    reader.readAsDataURL(file);
  }

  function saveGeneral() {
    if (!user) return;
    updateStaff(user.id, profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function saveStore() {
    updateSettings({ storeName: store.storeName, lowStockThreshold: parseNumberInput(store.lowStockThreshold) || 1 });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function saveReceipt() {
    updateSettings(receipt);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const allTabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'general', label: 'General', icon: User },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'staff', label: 'Staff Accounts', icon: Users },
    { id: 'receipt', label: 'Receipt Info', icon: Receipt },
    { id: 'reports', label: 'Year-End Reports', icon: FileSpreadsheet },
  ];
  const tabs = isStaff ? allTabs.filter((t) => t.id === 'general') : allTabs;

  return (
    <div className="space-y-5">
      <PageHeader title="Settings" subtitle={isStaff ? 'Manage your profile.' : 'Manage your admin profile, store and team.'} />

      <div className="flex flex-wrap gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <Card className="max-w-xl">
          <h2 className="mb-1 text-sm font-semibold text-ink">General</h2>
          <p className="mb-5 text-xs text-ink-faint">Public information about your account.</p>

          <div className="mb-6 flex items-center gap-4">
            <div className="relative">
              <Avatar name={user?.name ?? 'Admin'} src={user?.avatar} size={64} />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-raised bg-brand-500 text-white"
              >
                <Camera size={11} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
            </div>
            <div>
              <p className="text-sm font-medium text-ink">Profile photo</p>
              <p className="text-xs text-ink-faint">Click the camera icon to update.</p>
            </div>
          </div>

          <div className="space-y-4">
            <FieldWrap label="Username">
              <Input value={profile.username} onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="Full name">
              <Input value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="Position">
              <Input value={profile.position} onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="Phone number">
              <Input value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </FieldWrap>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={saveGeneral}>Save changes</Button>
            {saved && <span className="text-sm text-emerald-600">Saved!</span>}
          </div>
        </Card>
      )}

      {tab === 'store' && (
        <Card className="max-w-xl">
          <h2 className="mb-1 text-sm font-semibold text-ink">Store</h2>
          <p className="mb-5 text-xs text-ink-faint">Basic details about how your store runs.</p>

          <div className="space-y-4">
            <FieldWrap label="Store name">
              <Input value={store.storeName} onChange={(e) => setStore((s) => ({ ...s, storeName: e.target.value }))} />
            </FieldWrap>
            <FieldWrap label="Currency symbol" hint="Shiffy Gadgets Hub prices customers in Naira.">
              <Input value={settings.currencySymbol} disabled />
            </FieldWrap>
            <FieldWrap label="Low stock alert" hint="Flag a product when units remaining fall to or below this number.">
              <NumberInput value={store.lowStockThreshold} onValueChange={(v) => setStore((s) => ({ ...s, lowStockThreshold: v }))} />
            </FieldWrap>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <Button onClick={saveStore}>Save Settings</Button>
            {saved && <span className="text-sm text-emerald-600">Saved!</span>}
          </div>
        </Card>
      )}

      {tab === 'store' && (
        <Card className="max-w-xl">
          <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
            <RotateCcw size={15} /> Reset Total Sales
          </h2>
          <p className="mb-4 text-xs text-ink-faint">
            Starts the Dashboard's "Total Sales" figure fresh for a new year. Nothing is deleted — every past sale stays on record
            and in your Year-End Reports — this only changes what the running total on the Dashboard counts from.
          </p>

          {settings.salesResetAt ? (
            <div className="space-y-3">
              <p className="rounded-lg bg-amber-50 px-3.5 py-2.5 text-sm text-amber-700 dark:bg-amber-500/10">
                Total Sales has counted from zero since <strong>{formatDateTime(settings.salesResetAt)}</strong>.
              </p>
              <Button variant="outline" onClick={restoreTotalSales}>
                Restore Previous Total
              </Button>
            </div>
          ) : (
            <Button variant="outline" onClick={() => setResetConfirmOpen(true)}>
              Reset Total Sales
            </Button>
          )}

          <ConfirmDialog
            open={resetConfirmOpen}
            title="Reset Total Sales?"
            message="The Dashboard's Total Sales will show ₦0 and start counting fresh from right now. All past sales stay fully on record and can be restored to the total at any time."
            confirmLabel="Reset"
            onCancel={() => setResetConfirmOpen(false)}
            onConfirm={() => {
              resetTotalSales();
              setResetConfirmOpen(false);
            }}
          />
        </Card>
      )}

      {tab === 'staff' && <StaffAccountsPanel />}

      {tab === 'receipt' && (
        <div className="space-y-5">
          <Card className="max-w-xl">
            <h2 className="mb-1 text-sm font-semibold text-ink">Receipt Info</h2>
            <p className="mb-5 text-xs text-ink-faint">
              This logo, store name and address are what print at the top of every receipt your staff generate.
            </p>

            <div className="mb-6 flex items-center gap-4">
              <div className="relative">
                {receipt.logo ? (
                  <img src={receipt.logo} alt="Store logo" className="h-16 w-16 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface p-2">
                    <img src={logoMark} alt="" className="h-full w-full object-contain" />
                  </div>
                )}
                <button
                  onClick={() => logoRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface-raised bg-brand-500 text-white"
                >
                  <Camera size={11} />
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={onLogoChange} />
              </div>
              <div>
                <p className="text-sm font-medium text-ink">Store logo</p>
                <p className="text-xs text-ink-faint">Click the camera icon to upload. Falls back to the default mark if left empty.</p>
              </div>
            </div>

            <div className="space-y-4">
              <FieldWrap label="Store name">
                <Input value={receipt.storeName} onChange={(e) => setReceipt((r) => ({ ...r, storeName: e.target.value }))} />
              </FieldWrap>
              <FieldWrap label="Store address">
                <Input value={receipt.address} onChange={(e) => setReceipt((r) => ({ ...r, address: e.target.value }))} />
              </FieldWrap>
              <FieldWrap label="Support phone">
                <Input value={receipt.supportPhone} onChange={(e) => setReceipt((r) => ({ ...r, supportPhone: e.target.value }))} />
              </FieldWrap>
              <FieldWrap label="Support phone 2 (optional)">
                <Input value={receipt.supportPhone2} onChange={(e) => setReceipt((r) => ({ ...r, supportPhone2: e.target.value }))} />
              </FieldWrap>
              <FieldWrap label="Support email">
                <Input value={receipt.supportEmail} onChange={(e) => setReceipt((r) => ({ ...r, supportEmail: e.target.value }))} />
              </FieldWrap>
              <FieldWrap label="Receipt footer note">
                <Input value={receipt.receiptFooter} onChange={(e) => setReceipt((r) => ({ ...r, receiptFooter: e.target.value }))} />
              </FieldWrap>
            </div>

            <h3 className="mb-1 mt-6 text-sm font-semibold text-ink">Bank Details</h3>
            <p className="mb-4 text-xs text-ink-faint">Shown on an invoice as "Pay To" whenever a customer still owes a balance.</p>
            <div className="space-y-4">
              <FieldWrap label="Bank name">
                <Input value={receipt.bankName} onChange={(e) => setReceipt((r) => ({ ...r, bankName: e.target.value }))} placeholder="e.g. Providus Bank" />
              </FieldWrap>
              <FieldWrap label="Account number">
                <Input value={receipt.bankAccountNumber} onChange={(e) => setReceipt((r) => ({ ...r, bankAccountNumber: e.target.value }))} placeholder="0123456789" />
              </FieldWrap>
              <FieldWrap label="Account name">
                <Input value={receipt.bankAccountName} onChange={(e) => setReceipt((r) => ({ ...r, bankAccountName: e.target.value }))} placeholder="e.g. SHIFFY GADGETS HUB" />
              </FieldWrap>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Button onClick={saveReceipt}>Save Settings</Button>
              {saved && <span className="text-sm text-emerald-600">Saved!</span>}
            </div>
          </Card>

          <Card padded={false}>
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Generated Receipts</h2>
              <p className="text-xs text-ink-faint">Every receipt ever issued for a completed sale.</p>
            </div>
            {generatedReceipts.length === 0 ? (
              <div className="p-5">
                <EmptyState icon={Receipt} title="No receipts yet" message="Receipts appear here as soon as a sale is completed in full." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-ink-faint">
                      <th className="px-5 py-3 font-medium">Receipt No.</th>
                      <th className="px-5 py-3 font-medium">Item</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Amount</th>
                      <th className="px-5 py-3 font-medium">Date</th>
                      <th className="px-5 py-3 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {generatedReceipts.map((t) => (
                      <tr key={t.id} className="hover:bg-surface/60">
                        <td className="px-5 py-3 font-mono text-xs text-ink-soft">{t.receiptNo}</td>
                        <td className="px-5 py-3 text-ink">{t.itemName}</td>
                        <td className="px-5 py-3 text-ink-soft">{t.customerName}</td>
                        <td className="px-5 py-3 font-medium text-ink">{formatCurrency(t.totalAmount, settings.currencySymbol)}</td>
                        <td className="px-5 py-3 text-ink-soft">{formatDateTime(t.completedDate ?? t.takenDate)}</td>
                        <td className="px-5 py-3 text-right">
                          <Button size="sm" variant="outline" icon={<Eye size={13} />} onClick={() => navigate(`/receipt/${t.id}`)}>
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-5">
          <Card className="max-w-2xl">
            <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold text-ink">
              <FileSpreadsheet size={15} /> Year-End Wrap
            </h2>
            <p className="mb-5 text-xs text-ink-faint">
              Pick any year — including past years — to see a quick summary here, or download the full report: a dashboard sheet
              (revenue, profit, best month, top items, top customers, staff performance, insights) plus a second sheet with every
              transaction from that year, as an Excel file.
            </p>

            <div className="max-w-xs">
              <FieldWrap label="Year">
                <Select value={reportYear} onChange={(e) => setReportYear(Number(e.target.value))}>
                  {availableYears.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </Select>
              </FieldWrap>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <StatCard label="Total Revenue" value={formatCurrency(reportStats.revenue, settings.currencySymbol)} icon={TrendingUp} tone="emerald" />
              <StatCard label="Total Profit" value={formatCurrency(reportStats.profit, settings.currencySymbol)} icon={Wallet} tone="brand" />
              <StatCard label="Units Sold" value={reportStats.unitsSold} icon={Package} tone="violet" />
              <StatCard
                label="Avg. Sale Value"
                value={formatCurrency(reportStats.avgSaleValue, settings.currencySymbol)}
                icon={BarChart3}
                tone="brand"
              />
              <StatCard
                label="Outstanding (from this year)"
                value={formatCurrency(reportStats.outstandingFromYear, settings.currencySymbol)}
                icon={AlertCircle}
                tone="amber"
              />
              <StatCard
                label="Best Month"
                value={reportStats.bestMonth ? reportStats.bestMonth.label : '—'}
                sublabel={reportStats.bestMonth ? formatCurrency(reportStats.bestMonth.revenue, settings.currencySymbol) : undefined}
                icon={TrendingUp}
                tone="emerald"
              />
            </div>

            <div className="mt-6">
              <Button icon={<Download size={15} />} onClick={handleDownloadReport} disabled={generatingReport}>
                {generatingReport ? 'Generating…' : `Download ${reportYear} Year-End Report`}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
