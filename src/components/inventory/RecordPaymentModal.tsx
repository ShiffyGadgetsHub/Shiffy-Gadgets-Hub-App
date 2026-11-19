import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FieldWrap, NumberInput } from '../ui/Field';
import { useInventoryStore } from '../../store/inventoryStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatCurrency, parseNumberInput } from '../../lib/format';
import type { Transaction } from '../../types';

export default function RecordPaymentModal({ transaction, onClose }: { transaction: Transaction | null; onClose: () => void }) {
  const addPayment = useInventoryStore((s) => s.addPayment);
  const user = useAuthStore((s) => s.currentUser());
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);
  const [amount, setAmount] = useState('');

  if (!transaction) return null;
  const balance = transaction.totalAmount - transaction.amountPaid;

  function submit() {
    const value = parseNumberInput(amount);
    if (!transaction || value <= 0) return;
    addPayment(transaction.id, Math.min(value, balance), user?.name ?? 'Staff');
    setAmount('');
    onClose();
  }

  return (
    <Modal
      open={!!transaction}
      onClose={onClose}
      title={`Record payment — ${transaction.itemName}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={parseNumberInput(amount) <= 0}>
            Record Payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-surface px-4 py-3 text-sm">
          <div>
            <p className="text-ink-faint">Total price</p>
            <p className="font-semibold text-ink">{formatCurrency(transaction.totalAmount, currencySymbol)}</p>
          </div>
          <div>
            <p className="text-ink-faint">Already paid</p>
            <p className="font-semibold text-ink">{formatCurrency(transaction.amountPaid, currencySymbol)}</p>
          </div>
          <div className="col-span-2 border-t border-line pt-3">
            <p className="text-ink-faint">Balance remaining</p>
            <p className="font-semibold text-rose-600">{formatCurrency(balance, currencySymbol)}</p>
          </div>
        </div>
        <FieldWrap label="Amount received" required>
          <NumberInput prefix={currencySymbol} value={amount} onValueChange={setAmount} placeholder="0" autoFocus />
        </FieldWrap>
      </div>
    </Modal>
  );
}
