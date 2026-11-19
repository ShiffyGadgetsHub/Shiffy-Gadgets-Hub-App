import { useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, Clock, CheckCircle2, Search, Plus, ShoppingCart, Eye, Edit2, Trash2, PackageX, Wallet, Undo2, Receipt } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCatalogStore } from '../store/catalogStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useToastStore } from '../store/toastStore';
import { formatCurrency } from '../lib/format';
import { getItemsInStock, getCompletedTransactions, getItemTransaction, sortInventoryForDisplay } from '../lib/stats';
import { isEidCode } from '../lib/scanCodes';
import { useBasePath, useIsStaffView } from '../lib/useBasePath';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FilterSelect from '../components/ui/FilterSelect';
import Badge, { itemStatusTone, conditionTone } from '../components/ui/Badge';
import ProductIcon from '../components/ui/ProductIcon';
import ActionMenu from '../components/ui/ActionMenu';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState from '../components/ui/EmptyState';
import ReleaseItemModal from '../components/inventory/ReleaseItemModal';
import RecordPaymentModal from '../components/inventory/RecordPaymentModal';
import EditItemModal from '../components/inventory/EditItemModal';
import AddSaleModal from '../components/inventory/AddSaleModal';
import type { InventoryItem, Transaction } from '../types';

const STATUS_LABEL: Record<string, string> = { in_stock: 'In Stock', out: 'Out / Outstanding', sold: 'Sold' };

export default function InventoryPage() {
  const navigate = useNavigate();
  const base = useBasePath();
  const isStaff = useIsStaffView();
  const [params, setParams] = useSearchParams();
  const items = useInventoryStore((s) => s.items);
  const transactions = useInventoryStore((s) => s.transactions);
  const deleteItem = useInventoryStore((s) => s.deleteItem);
  const returnItem = useInventoryStore((s) => s.returnItem);
  const categories = useCatalogStore((s) => s.categories);
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);
  const user = useAuthStore((s) => s.currentUser());

  const [search, setSearch] = useState(params.get('q') ?? '');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [status, setStatus] = useState('All');

  const [releaseItem, setReleaseItem] = useState<InventoryItem | null>(null);
  const [paymentItem, setPaymentItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);
  const [returnTarget, setReturnTarget] = useState<Transaction | null>(null);
  const [addSaleOpen, setAddSaleOpen] = useState(false);

  function setSearchValue(value: string) {
    setSearch(value);
    setParams((p) => {
      if (value) p.set('q', value);
      else p.delete('q');
      return p;
    });
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    const q = search.trim();
    if (q && isEidCode(q)) {
      useToastStore.getState().push({
        tone: 'warning',
        title: 'Wrong barcode scanned',
        message: 'That looks like an EID number. This search only matches by serial number or IMEI — scan one of those barcodes instead.',
      });
      setSearchValue('');
    }
  }

  const stats = useMemo(() => {
    const breakdown = <T,>(list: T[], condition: (x: T) => 'New' | 'Used') => {
      const newCount = list.filter((x) => condition(x) === 'New').length;
      return { total: list.length, newCount, usedCount: list.length - newCount };
    };
    return {
      inStock: breakdown(getItemsInStock(items), (i) => i.condition),
      pending: breakdown(
        items.filter((i) => i.status === 'out'),
        (i) => i.condition
      ),
      sold: breakdown(getCompletedTransactions(transactions), (t) => t.itemCondition),
    };
  }, [items, transactions]);

  const filtered = useMemo(() => {
    const sorted = sortInventoryForDisplay(items, transactions);
    const q = search.trim().toLowerCase();
    return sorted.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (condition !== 'All' && item.condition !== condition) return false;
      if (status !== 'All' && item.status !== status) return false;
      if (!q) return true;
      const txn = getItemTransaction(transactions, item.id);
      return (
        item.name.toLowerCase().includes(q) ||
        item.serialNumber.toLowerCase().includes(q) ||
        (item.imei ?? '').toLowerCase().includes(q) ||
        (txn?.customerName ?? '').toLowerCase().includes(q)
      );
    });
  }, [items, transactions, search, category, condition, status]);

  return (
    <div className="space-y-5">
      <PageHeader title="Inventory" subtitle="Every unit you've ever stocked, tracked by serial number." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Items in Stock" value={stats.inStock.total} sublabel={`${stats.inStock.newCount} New · ${stats.inStock.usedCount} Used`} icon={Boxes} tone="brand" />
        <StatCard label="Out / Outstanding return" value={stats.pending.total} sublabel={`${stats.pending.newCount} New · ${stats.pending.usedCount} Used`} icon={Clock} tone="amber" />
        <StatCard label="Item Sold" value={stats.sold.total} sublabel={`${stats.sold.newCount} New · ${stats.sold.usedCount} Used`} icon={CheckCircle2} tone="emerald" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search or scan name, serial, IMEI or customer…"
              className="h-10 w-full rounded-lg border border-line bg-surface-soft pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-400"
            />
          </div>
          <FilterSelect value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </FilterSelect>
          <FilterSelect value={condition} onChange={(e) => setCondition(e.target.value)}>
            <option value="All">All Conditions</option>
            <option value="New">New</option>
            <option value="Used">Used</option>
          </FilterSelect>
          <FilterSelect value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="All">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="out">Out / Outstanding</option>
            <option value="sold">Sold</option>
          </FilterSelect>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" icon={<ShoppingCart size={15} />} onClick={() => setAddSaleOpen(true)}>
              Add Sales
            </Button>
            <Button variant="dark" icon={<Plus size={15} />} onClick={() => navigate(`${base}/add-stock`)}>
              Add Stock
            </Button>
          </div>
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={PackageX} title="No items found" message="Try adjusting your search or filters, or add new stock to get started." />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-line bg-surface text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-semibold">Product Name</th>
                  <th className="px-5 py-3 font-semibold">Condition</th>
                  <th className="px-5 py-3 font-semibold">Serial Number</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Color</th>
                  <th className="px-5 py-3 font-semibold">Price</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Taken By</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filtered.map((item) => {
                  const txn = getItemTransaction(transactions, item.id);
                  const editDeleteItems = isStaff
                    ? []
                    : [
                        { label: 'Edit', icon: Edit2, onClick: () => setEditItem(item) },
                        { label: 'Delete', icon: Trash2, onClick: () => setDeleteTarget(item), danger: true },
                      ];
                  const menuItems =
                    item.status === 'in_stock'
                      ? [
                          { label: 'View details', icon: Eye, onClick: () => navigate(`${base}/inventory/${item.id}`) },
                          { label: 'Release item', icon: PackageX, onClick: () => setReleaseItem(item) },
                          ...editDeleteItems,
                        ]
                      : item.status === 'out'
                      ? [
                          { label: 'View details', icon: Eye, onClick: () => navigate(`${base}/inventory/${item.id}`) },
                          { label: 'Record payment', icon: Wallet, onClick: () => setPaymentItem(item) },
                          { label: 'Return item', icon: Undo2, onClick: () => txn && setReturnTarget(txn) },
                          ...editDeleteItems,
                        ]
                      : [
                          { label: 'View details', icon: Eye, onClick: () => navigate(`${base}/inventory/${item.id}`) },
                          ...(txn ? [{ label: 'Generate receipt', icon: Receipt, onClick: () => navigate(`/receipt/${txn.id}`) }] : []),
                          ...(isStaff ? [] : [{ label: 'Delete', icon: Trash2, onClick: () => setDeleteTarget(item), danger: true }]),
                        ];

                  return (
                    <tr key={item.id} className="hover:bg-surface/60">
                      <td className="px-5 py-3">
                        <button onClick={() => navigate(`${base}/inventory/${item.id}`)} className="flex items-center gap-3 text-left">
                          <ProductIcon category={item.category} size="sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink hover:text-brand-500">{item.name}</p>
                            <p className="text-xs text-ink-faint">{item.brand}</p>
                          </div>
                        </button>
                      </td>
                      <td className="px-5 py-3">
                        <Badge tone={conditionTone(item.condition)}>{item.condition}</Badge>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-ink-soft">{item.serialNumber}</td>
                      <td className="px-5 py-3 text-ink-soft">{item.category}</td>
                      <td className="px-5 py-3 text-ink-soft">{item.color}</td>
                      <td className="px-5 py-3 font-medium text-ink">{formatCurrency(item.sellingPrice, currencySymbol)}</td>
                      <td className="px-5 py-3">
                        <Badge tone={itemStatusTone(item.status)}>{STATUS_LABEL[item.status]}</Badge>
                      </td>
                      <td className="px-5 py-3 text-ink-soft">{item.status === 'in_stock' ? '—' : txn?.customerName ?? '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <ActionMenu items={menuItems} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AddSaleModal open={addSaleOpen} onClose={() => setAddSaleOpen(false)} />
      <ReleaseItemModal item={releaseItem} onClose={() => setReleaseItem(null)} />
      <RecordPaymentModal transaction={paymentItem ? getItemTransaction(transactions, paymentItem.id) ?? null : null} onClose={() => setPaymentItem(null)} />
      <EditItemModal item={editItem} onClose={() => setEditItem(null)} />
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete item"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteItem(deleteTarget.id, user?.name ?? 'Staff');
          setDeleteTarget(null);
        }}
      />
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
