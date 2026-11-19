import { useMemo, useState, type KeyboardEvent } from 'react';
import { Search, X, ChevronLeft } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Badge, { conditionTone } from '../ui/Badge';
import ProductIcon from '../ui/ProductIcon';
import { FieldWrap, Input, NumberInput, Textarea } from '../ui/Field';
import CustomerNameCombobox from '../ui/CustomerNameCombobox';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToastStore } from '../../store/toastStore';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../../lib/format';
import { getItemsInStock } from '../../lib/stats';
import { isEidCode } from '../../lib/scanCodes';
import type { InventoryItem } from '../../types';

export default function AddSaleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useInventoryStore((s) => s.items);
  const takeOutItem = useInventoryStore((s) => s.takeOutItem);
  const user = useAuthStore((s) => s.currentUser());
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);

  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<InventoryItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    const inStock = getItemsInStock(items);
    if (!q) return inStock.slice(0, 30);
    return inStock.filter(
      (i) => i.name.toLowerCase().includes(q) || i.serialNumber.toLowerCase().includes(q) || (i.imei ?? '').toLowerCase().includes(q)
    );
  }, [items, search]);

  function selectItem(item: InventoryItem) {
    setSelected(item);
    setTotalAmount(item.sellingPrice.toLocaleString());
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const q = search.trim().toLowerCase();
    if (!q) return;
    if (isEidCode(q)) {
      useToastStore.getState().push({
        tone: 'warning',
        title: 'Wrong barcode scanned',
        message: 'That looks like an EID number, not a serial number or IMEI. Scan the item’s serial number or IMEI barcode instead.',
      });
      setSearch('');
      return;
    }
    const exact = results.find((i) => i.serialNumber.toLowerCase() === q || (i.imei ?? '').toLowerCase() === q);
    const match = exact ?? (results.length === 1 ? results[0] : undefined);
    if (match) selectItem(match);
  }

  function reset() {
    setSearch('');
    setSelected(null);
    setCustomerName('');
    setCustomerPhone('');
    setTotalAmount('');
    setAmountPaid('0');
    setNotes('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function submit() {
    if (!selected || !customerName.trim()) return;
    const total = parseNumberInput(totalAmount) || selected.sellingPrice;
    takeOutItem({
      itemId: selected.id,
      customerName,
      customerPhone,
      totalAmount: total,
      amountPaid: parseNumberInput(amountPaid),
      staffName: user?.name ?? 'Staff',
      notes,
    });
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Sale" size="lg">
      {!selected ? (
        <div className="space-y-3">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Search or scan item by name, serial number or IMEI…"
              className="h-10 w-full rounded-lg border border-line bg-surface-soft pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-400"
            />
          </div>
          <div className="max-h-80 divide-y divide-line overflow-y-auto rounded-lg border border-line">
            {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-ink-faint">No in-stock items match your search.</p>}
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => selectItem(item)}
                className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-surface"
              >
                <ProductIcon category={item.category} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  <p className="truncate font-mono text-xs text-ink-faint">
                    S/N: {item.serialNumber}
                    {item.imei && <> · IMEI: {item.imei}</>}
                  </p>
                </div>
                <Badge tone={conditionTone(item.condition)}>{item.condition}</Badge>
                <span className="shrink-0 text-sm font-semibold text-ink">{formatCurrency(item.sellingPrice, currencySymbol)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-surface p-3">
            <button
              onClick={() => setSelected(null)}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-faint hover:bg-surface-raised hover:text-ink"
            >
              <ChevronLeft size={16} />
            </button>
            <ProductIcon category={selected.category} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink">{selected.name}</p>
              <p className="truncate font-mono text-xs text-ink-faint">S/N: {selected.serialNumber}</p>
            </div>
            <button onClick={() => setSelected(null)} className="shrink-0 text-xs font-medium text-brand-500 hover:underline">
              Change
            </button>
          </div>

          <FieldWrap label="Customer name" required hint="Type a returning customer's name to auto-fill their phone number.">
            <CustomerNameCombobox
              value={customerName}
              onTextChange={setCustomerName}
              onSelect={(c) => {
                setCustomerName(c.name);
                setCustomerPhone(c.phone);
              }}
            />
          </FieldWrap>
          <FieldWrap label="Customer phone (WhatsApp)">
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="08012345678" />
          </FieldWrap>
          <div className="grid grid-cols-2 gap-4">
            <FieldWrap label="Total price" hint={`Defaults to ${currencySymbol}${selected.sellingPrice.toLocaleString()}`}>
              <NumberInput prefix={currencySymbol} value={totalAmount} onValueChange={(v) => setTotalAmount(formatNumberInput(v))} />
            </FieldWrap>
            <FieldWrap label="Amount paid now">
              <NumberInput prefix={currencySymbol} value={amountPaid} onValueChange={(v) => setAmountPaid(formatNumberInput(v))} />
            </FieldWrap>
          </div>
          <p className="text-xs text-ink-faint">
            Leave "Amount paid" at 0 if the customer is taking the item on credit. It will show up as Outstanding until fully paid.
          </p>
          <FieldWrap label="Notes (optional)">
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </FieldWrap>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button variant="outline" icon={<X size={15} />} onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!customerName.trim()}>
              Record Sale
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
