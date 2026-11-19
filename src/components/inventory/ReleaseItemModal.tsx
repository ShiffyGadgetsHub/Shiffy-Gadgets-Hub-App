import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FieldWrap, Input, NumberInput, Textarea } from '../ui/Field';
import CustomerNameCombobox from '../ui/CustomerNameCombobox';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatNumberInput, parseNumberInput } from '../../lib/format';
import type { InventoryItem } from '../../types';

export default function ReleaseItemModal({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const takeOutItem = useInventoryStore((s) => s.takeOutItem);
  const user = useAuthStore((s) => s.currentUser());
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [amountPaid, setAmountPaid] = useState('0');
  const [notes, setNotes] = useState('');

  if (!item) return null;

  function reset() {
    setCustomerName('');
    setCustomerPhone('');
    setTotalAmount('');
    setAmountPaid('0');
    setNotes('');
  }

  function submit() {
    if (!item || !customerName.trim()) return;
    const total = parseNumberInput(totalAmount) || item!.sellingPrice;
    takeOutItem({
      itemId: item!.id,
      customerName,
      customerPhone,
      totalAmount: total,
      amountPaid: parseNumberInput(amountPaid),
      staffName: user?.name ?? 'Staff',
      notes,
    });
    reset();
    onClose();
  }

  return (
    <Modal
      open={!!item}
      onClose={() => {
        reset();
        onClose();
      }}
      title={`Release — ${item.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!customerName.trim()}>
            Release Item
          </Button>
        </>
      }
    >
      <div className="space-y-4">
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
          <FieldWrap label="Total price" hint={`Defaults to ${currencySymbol}${item.sellingPrice.toLocaleString()}`}>
            <NumberInput prefix={currencySymbol} value={totalAmount} onValueChange={setTotalAmount} placeholder={item.sellingPrice.toLocaleString()} />
          </FieldWrap>
          <FieldWrap label="Amount paid now">
            <NumberInput prefix={currencySymbol} value={amountPaid} onValueChange={(v) => setAmountPaid(formatNumberInput(v))} />
          </FieldWrap>
        </div>
        <p className="text-xs text-ink-faint">
          Leave "Amount paid" at 0 if the customer has taken the item on credit. The item leaves stock either way, and
          returns to stock only if it comes back.
        </p>
        <FieldWrap label="Notes (optional)">
          <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FieldWrap>
      </div>
    </Modal>
  );
}
