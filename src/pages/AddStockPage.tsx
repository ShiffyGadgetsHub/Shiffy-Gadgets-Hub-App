import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import StockLineCard, { type DraftLine } from '../components/inventory/StockLineCard';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import { useInventoryStore } from '../store/inventoryStore';
import { useAuthStore } from '../store/authStore';
import { generateId } from '../lib/id';
import { parseNumberInput } from '../lib/format';
import { useBasePath } from '../lib/useBasePath';

function emptyLine(): DraftLine {
  return {
    key: generateId('line'),
    category: '',
    brand: '',
    name: '',
    condition: 'New',
    simType: undefined,
    quantity: 1,
    serials: [''],
    imeis: [''],
    colors: [''],
    costPrice: '',
    sellingPrice: '',
    supplier: '',
    notes: '',
  };
}

function isLineValid(line: DraftLine): boolean {
  return Boolean(
    line.category &&
      line.brand &&
      line.name &&
      line.supplier.trim() &&
      parseNumberInput(line.costPrice) > 0 &&
      parseNumberInput(line.sellingPrice) > 0 &&
      line.serials.every((s) => s.trim().length > 0) &&
      line.colors.every((c) => c.trim().length > 0) &&
      (line.category !== 'Phones' || line.simType)
  );
}

export default function AddStockPage() {
  const navigate = useNavigate();
  const base = useBasePath();
  const addStock = useInventoryStore((s) => s.addStock);
  const user = useAuthStore((s) => s.currentUser());
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [attempted, setAttempted] = useState(false);

  const allValid = lines.every(isLineValid);

  function submit() {
    setAttempted(true);
    if (!allValid) return;
    addStock(
      lines.map((l) => ({
        category: l.category,
        brand: l.brand,
        name: l.name,
        condition: l.condition,
        simType: l.simType,
        costPrice: parseNumberInput(l.costPrice),
        sellingPrice: parseNumberInput(l.sellingPrice),
        supplier: l.supplier,
        quantity: l.quantity,
        serials: l.serials,
        imeis: l.imeis,
        colors: l.colors,
        notes: l.notes,
      })),
      user?.name ?? 'Staff'
    );
    navigate(`${base}/inventory`);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add Stock"
        subtitle="Add one or several items to your inventory at once."
        actions={
          <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={() => navigate(-1)}>
            Back
          </Button>
        }
      />

      <div className="space-y-5">
        {lines.map((line, i) => (
          <StockLineCard
            key={line.key}
            line={line}
            index={i}
            canRemove={lines.length > 1}
            onChange={(next) => setLines((ls) => ls.map((l) => (l.key === next.key ? next : l)))}
            onRemove={() => setLines((ls) => ls.filter((l) => l.key !== line.key))}
          />
        ))}

        <button
          type="button"
          onClick={() => setLines((ls) => [...ls, emptyLine()])}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line py-4 text-sm font-medium text-ink-soft transition-colors hover:border-brand-300 hover:text-brand-500"
        >
          <Plus size={16} /> Add New Item Line
        </button>

        {attempted && !allValid && (
          <p className="rounded-lg bg-rose-50 px-4 py-2.5 text-sm text-rose-600 dark:bg-rose-500/10">
            Please complete every required field (category, brand, item name, color, supplier, prices, serial numbers, and SIM type for phones) on each line before continuing.
          </p>
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 -mb-6 mt-2 border-t border-line bg-surface-raised px-4 py-3 sm:-mx-6 sm:px-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={submit}>
            Add to Stock
          </Button>
        </div>
      </div>
    </div>
  );
}
