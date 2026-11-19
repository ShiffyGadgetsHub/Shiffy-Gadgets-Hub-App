import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  PackageX,
  Wallet,
  Undo2,
  Receipt,
  User,
  Truck,
  CalendarPlus,
  CalendarCheck,
  History,
  Phone,
} from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { formatCurrency, formatDateTime } from '../lib/format';
import { getItemTransaction } from '../lib/stats';
import ProductIcon from '../components/ui/ProductIcon';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge, { itemStatusTone, paymentStatusTone, conditionTone } from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ReleaseItemModal from '../components/inventory/ReleaseItemModal';
import RecordPaymentModal from '../components/inventory/RecordPaymentModal';
import EditItemModal from '../components/inventory/EditItemModal';
import { useBasePath, useIsStaffView } from '../lib/useBasePath';

const STATUS_LABEL: Record<string, string> = { in_stock: 'In Stock', out: 'Out / Outstanding', sold: 'Sold' };

function DetailRow({ icon: Icon, label, value }: { icon: typeof User; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-ink-faint">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-ink-faint">{label}</p>
        <p className="truncate text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function ViewItemPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const base = useBasePath();
  const isStaff = useIsStaffView();
  const items = useInventoryStore((s) => s.items);
  const transactions = useInventoryStore((s) => s.transactions);
  const deleteItem = useInventoryStore((s) => s.deleteItem);
  const returnItem = useInventoryStore((s) => s.returnItem);
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);
  const user = useAuthStore((s) => s.currentUser());

  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  const [releaseOpen, setReleaseOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);

  const item = items.find((i) => i.id === id);
  const txn = item ? getItemTransaction(transactions, item.id) : undefined;
  const itemHistory = transactions.filter((t) => t.itemId === id);

  if (!item) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <p className="text-ink-soft">Item not found.</p>
        <Button className="mt-4" onClick={() => navigate(`${base}/inventory`)}>Back to Inventory</Button>
      </div>
    );
  }

  const margin = item.sellingPrice - item.costPrice;

  return (
    <div className="space-y-5">
      <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={() => navigate(`${base}/inventory`)}>
        Back to Inventory
      </Button>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        <Card className="flex flex-col items-center justify-center gap-4 lg:col-span-2">
          <div className="aspect-square w-full max-w-xs overflow-hidden rounded-2xl">
            <ProductIcon category={item.category} size="xl" className="rounded-2xl" />
          </div>
          <div className="w-full text-center">
            <h1 className="text-lg font-bold text-ink">{item.name}</h1>
            <p className="text-sm text-ink-soft">{item.brand} · {item.color}</p>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              <Badge tone={conditionTone(item.condition)}>{item.condition}</Badge>
              <Badge tone={itemStatusTone(item.status)}>{STATUS_LABEL[item.status]}</Badge>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 border-t border-line pt-4">
            {item.status === 'in_stock' && (
              <>
                <Button
                  variant="dark"
                  icon={<PackageX size={15} />}
                  onClick={() => setReleaseOpen(true)}
                  className={isStaff ? 'col-span-2' : ''}
                >
                  Release
                </Button>
                {!isStaff && (
                  <Button variant="outline" icon={<Edit2 size={15} />} onClick={() => setEditOpen(true)}>Edit</Button>
                )}
              </>
            )}
            {item.status === 'out' && (
              <>
                <Button icon={<Wallet size={15} />} onClick={() => setPaymentOpen(true)}>Record Payment</Button>
                <Button variant="outline" icon={<Undo2 size={15} />} onClick={() => setReturnOpen(true)}>
                  Return Item
                </Button>
                {txn && (
                  <Button variant="outline" icon={<Receipt size={15} />} onClick={() => navigate(`/receipt/${txn.id}`)} className="col-span-2">
                    View Invoice
                  </Button>
                )}
              </>
            )}
            {item.status === 'sold' && txn && (
              <Button icon={<Receipt size={15} />} onClick={() => navigate(`/receipt/${txn.id}`)} className="col-span-2">
                Generate Receipt
              </Button>
            )}
            {!isStaff && (
              <Button variant="danger" icon={<Trash2 size={15} />} onClick={() => setDeleteOpen(true)} className="col-span-2">
                Delete Item
              </Button>
            )}
          </div>
        </Card>

        <div className="space-y-5 lg:col-span-3">
          <Card>
            <h2 className="mb-1 text-sm font-semibold text-ink">Overview</h2>
            <div className="divide-y divide-line">
              <DetailRow icon={User} label="Posted by" value={item.postedBy} />
              <DetailRow icon={Truck} label="Supplier" value={item.supplier} />
              <DetailRow icon={CalendarPlus} label="Date in" value={formatDateTime(item.dateAdded)} />
              {item.editedDate && <DetailRow icon={History} label="Edited" value={`${formatDateTime(item.editedDate)} by ${item.editedBy}`} />}
              <DetailRow icon={Receipt} label="Serial number" value={<span className="font-mono">{item.serialNumber}</span>} />
              {item.imei && <DetailRow icon={Receipt} label="IMEI number" value={<span className="font-mono">{item.imei}</span>} />}
            </div>
          </Card>

          <Card>
            <h2 className="mb-1 text-sm font-semibold text-ink">Pricing</h2>
            <div className={`grid gap-3 pt-2 text-center ${isStaff ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {!isStaff && (
                <div className="rounded-xl bg-surface p-3">
                  <p className="text-xs text-ink-faint">Cost price</p>
                  <p className="mt-1 text-sm font-bold text-ink">{formatCurrency(item.costPrice, currencySymbol)}</p>
                </div>
              )}
              <div className="rounded-xl bg-surface p-3">
                <p className="text-xs text-ink-faint">Sales price</p>
                <p className="mt-1 text-sm font-bold text-ink">{formatCurrency(item.sellingPrice, currencySymbol)}</p>
              </div>
              {!isStaff && (
                <div className="rounded-xl bg-surface p-3">
                  <p className="text-xs text-ink-faint">Margin</p>
                  <p className="mt-1 text-sm font-bold text-emerald-600">{formatCurrency(margin, currencySymbol)}</p>
                </div>
              )}
            </div>
          </Card>

          {txn && (
            <Card>
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-ink">
                  {item.status === 'sold' ? 'Sale details' : 'Current transaction'}
                </h2>
                <Badge tone={txn.status === 'completed' ? 'green' : txn.status === 'returned' ? 'blue' : paymentStatusTone(txn.paymentStatus)}>
                  {txn.status === 'completed' ? 'Completed' : txn.status === 'returned' ? 'Returned' : txn.paymentStatus === 'partial' ? 'Partial payment' : 'Unpaid'}
                </Badge>
              </div>
              <div className="divide-y divide-line">
                <DetailRow icon={User} label="Customer" value={txn.customerName} />
                {txn.customerPhone && <DetailRow icon={Phone} label="Phone" value={txn.customerPhone} />}
                <DetailRow icon={CalendarCheck} label="Date out" value={formatDateTime(txn.takenDate)} />
                {txn.returnedDate && <DetailRow icon={Undo2} label="Returned on" value={formatDateTime(txn.returnedDate)} />}
                <DetailRow
                  icon={Wallet}
                  label="Payment"
                  value={`${formatCurrency(txn.amountPaid, currencySymbol)} of ${formatCurrency(txn.totalAmount, currencySymbol)} (${txn.paymentStatus === 'paid' ? 'Full price' : 'Part price'})`}
                />
                {txn.totalAmount - txn.amountPaid > 0 && (
                  <DetailRow
                    icon={Wallet}
                    label="Amount remaining"
                    value={<span className="text-rose-600">{formatCurrency(txn.totalAmount - txn.amountPaid, currencySymbol)}</span>}
                  />
                )}
                <DetailRow icon={User} label="Staff" value={txn.staffName} />
              </div>
            </Card>
          )}

          {itemHistory.length > 1 && (
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-ink">History</h2>
              <div className="divide-y divide-line">
                {itemHistory.map((t) => (
                  <DetailRow
                    key={t.id}
                    icon={History}
                    label={formatDateTime(t.takenDate)}
                    value={`${t.customerName} — ${t.status === 'completed' ? 'Sold' : t.status === 'returned' ? 'Returned' : 'Outstanding'}`}
                  />
                ))}
              </div>
            </Card>
          )}

          {item.notes && (
            <Card>
              <h2 className="mb-1 text-sm font-semibold text-ink">Notes</h2>
              <p className="text-sm text-ink-soft">{item.notes}</p>
            </Card>
          )}
        </div>
      </div>

      <ReleaseItemModal item={releaseOpen ? item : null} onClose={() => setReleaseOpen(false)} />
      <RecordPaymentModal transaction={paymentOpen ? txn ?? null : null} onClose={() => setPaymentOpen(false)} />
      <EditItemModal item={editOpen ? item : null} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        title="Delete item"
        message={`Are you sure you want to delete "${item.name}"? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          deleteItem(item.id, user?.name ?? 'Staff');
          navigate(`${base}/inventory`);
        }}
      />
      <ConfirmDialog
        open={returnOpen}
        title="Return item"
        message={`Are you sure ${txn?.customerName} is returning "${item.name}"?`}
        confirmLabel="Yes"
        cancelLabel="No"
        onCancel={() => setReturnOpen(false)}
        onConfirm={() => {
          if (txn) returnItem(txn.id, user?.name ?? 'Staff');
          setReturnOpen(false);
        }}
      />
    </div>
  );
}
