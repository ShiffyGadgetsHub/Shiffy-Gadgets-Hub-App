import { useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { useCatalogStore } from '../../store/catalogStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useToastStore } from '../../store/toastStore';
import { FieldWrap, Input, NumberInput, Select, SegmentedToggle, Textarea, UppercaseInput } from '../ui/Field';
import ItemNameCombobox from '../ui/ItemNameCombobox';
import { isImeiCode, isEidCode, isSerialCode } from '../../lib/scanCodes';
import type { Condition, SimType } from '../../types';

export interface DraftLine {
  key: string;
  category: string;
  brand: string;
  name: string;
  condition: Condition;
  simType?: SimType;
  quantity: number;
  serials: string[];
  imeis: string[];
  colors: string[];
  costPrice: string;
  sellingPrice: string;
  supplier: string;
  notes: string;
}

export default function StockLineCard({
  line,
  index,
  canRemove,
  onChange,
  onRemove,
}: {
  line: DraftLine;
  index: number;
  canRemove: boolean;
  onChange: (next: DraftLine) => void;
  onRemove: () => void;
}) {
  const categories = useCatalogStore((s) => s.categories);
  const brandsFor = useCatalogStore((s) => s.brandsFor);
  const itemNamesFor = useCatalogStore((s) => s.itemNamesFor);
  const colors = useCatalogStore((s) => s.colors);
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);

  function set<K extends keyof DraftLine>(key: K, value: DraftLine[K]) {
    onChange({ ...line, [key]: value });
  }

  function setQuantity(q: number) {
    const quantity = Math.max(1, q);
    const serials = Array.from({ length: quantity }).map((_, i) => line.serials[i] ?? '');
    const imeis = Array.from({ length: quantity }).map((_, i) => line.imeis[i] ?? '');
    const colors = Array.from({ length: quantity }).map((_, i) => line.colors[i] ?? '');
    onChange({ ...line, quantity, serials, imeis, colors });
  }

  const brandOptions = brandsFor(line.category);
  const itemOptions = itemNamesFor(line.category, line.brand);

  const serialRefs = useRef<Array<HTMLInputElement | null>>([]);
  const imeiRefs = useRef<Array<HTMLInputElement | null>>([]);

  function focusSerial(i: number) {
    serialRefs.current[i]?.focus();
    serialRefs.current[i]?.select();
  }
  function focusImei(i: number) {
    imeiRefs.current[i]?.focus();
    imeiRefs.current[i]?.select();
  }

  function warnWrongCode(message: string) {
    useToastStore.getState().push({ tone: 'warning', title: 'Wrong barcode scanned', message });
  }

  // Returns true if the serial field at i holds an acceptable code (clears it and warns otherwise).
  function validateSerial(i: number): boolean {
    const value = (line.serials[i] ?? '').trim();
    if (!value || isSerialCode(value)) return true;
    const kind = isImeiCode(value) ? 'an IMEI number' : 'an EID number';
    warnWrongCode(`That looks like ${kind}, not a serial number. Scan the Serial Number barcode instead.`);
    const serials = [...line.serials];
    serials[i] = '';
    set('serials', serials);
    return false;
  }

  // Returns true if the IMEI field at i holds an acceptable code (clears it and warns otherwise). Empty is fine — IMEI is optional.
  function validateImei(i: number): boolean {
    const value = (line.imeis[i] ?? '').trim();
    if (!value || isImeiCode(value)) return true;
    const kind = isEidCode(value) ? 'an EID number' : 'a serial number';
    warnWrongCode(`That looks like ${kind}, not an IMEI. Scan the IMEI barcode instead (15 digits).`);
    const imeis = [...line.imeis];
    imeis[i] = '';
    set('imeis', imeis);
    return false;
  }

  return (
    <div className="rounded-2xl border border-line bg-surface-raised p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
            {index + 1}
          </span>
          Stock Information
        </div>
        {canRemove && (
          <button type="button" onClick={onRemove} className="flex items-center gap-1.5 text-xs font-medium text-rose-500 hover:underline">
            <Trash2 size={14} /> Remove
          </button>
        )}
      </div>

      <div className="mb-4">
        <FieldWrap label="Quick search item name" hint="Search any item — picking one fills category and brand automatically.">
          <ItemNameCombobox
            value={line.name}
            onTextChange={(text) => set('name', text)}
            onSelect={(record) => onChange({ ...line, category: record.category, brand: record.brand, name: record.name })}
          />
        </FieldWrap>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldWrap label="Category" required>
          <Select
            value={line.category}
            onChange={(e) =>
              onChange({
                ...line,
                category: e.target.value,
                brand: '',
                name: line.name,
                simType: e.target.value === 'Phones' ? line.simType ?? 'eSIM' : undefined,
              })
            }
          >
            <option value="">Select</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap label="Brand Name" required>
          <Select value={line.brand} onChange={(e) => set('brand', e.target.value)} disabled={!line.category}>
            <option value="">Select</option>
            {brandOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </FieldWrap>

        <FieldWrap label="Item Name" required>
          <Select value={line.name} onChange={(e) => set('name', e.target.value)} disabled={!line.brand}>
            <option value="">Select</option>
            {itemOptions.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
            {line.name && !itemOptions.includes(line.name) && <option value={line.name}>{line.name}</option>}
          </Select>
        </FieldWrap>
        <FieldWrap label="Condition" required>
          <SegmentedToggle
            options={[{ label: 'Used', value: 'Used' }, { label: 'New', value: 'New' }]}
            value={line.condition}
            onChange={(v) => set('condition', v as Condition)}
          />
        </FieldWrap>
        {line.category === 'Phones' && (
          <FieldWrap label="SIM Type" required>
            <SegmentedToggle
              options={[{ label: 'eSIM', value: 'eSIM' }, { label: 'PS', value: 'PS' }]}
              value={line.simType ?? 'eSIM'}
              onChange={(v) => set('simType', v as SimType)}
            />
          </FieldWrap>
        )}

        <FieldWrap label="Quantity" required hint="Add more than one identical unit at once.">
          <Input
            type="number"
            min={1}
            value={line.quantity}
            onChange={(e) => setQuantity(Number(e.target.value) || 1)}
          />
        </FieldWrap>
        <FieldWrap label="Cost Price" required>
          <NumberInput prefix={currencySymbol} value={line.costPrice} onValueChange={(v) => set('costPrice', v)} placeholder="0" />
        </FieldWrap>

        <FieldWrap label="Sales Price" required>
          <NumberInput prefix={currencySymbol} value={line.sellingPrice} onValueChange={(v) => set('sellingPrice', v)} placeholder="0" />
        </FieldWrap>
        <FieldWrap label="Supplier" required>
          <Input value={line.supplier} onChange={(e) => set('supplier', e.target.value)} placeholder="e.g. Lagos Mega Supplies" />
        </FieldWrap>
      </div>

      <div className="mt-4 rounded-xl bg-surface p-4">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Serial number{line.quantity > 1 ? 's' : ''}, IMEI & Color {line.quantity > 1 ? `(${line.quantity} units)` : ''}
        </p>
        <p className="mb-3 text-[11px] text-ink-faint">
          Click into a Serial Number field, then scan with a barcode scanner — each scan fills the field and jumps to the next.
        </p>
        <div className="space-y-2.5">
          {Array.from({ length: line.quantity }).map((_, i) => (
            <div key={i} className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <UppercaseInput
                ref={(el) => {
                  serialRefs.current[i] = el;
                }}
                value={line.serials[i] ?? ''}
                onChange={(e) => {
                  const serials = [...line.serials];
                  serials[i] = e.target.value;
                  set('serials', serials);
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  if (!validateSerial(i)) {
                    focusSerial(i);
                    return;
                  }
                  if (i + 1 < line.quantity) focusSerial(i + 1);
                  else focusImei(i);
                }}
                onBlur={() => validateSerial(i)}
                placeholder={`Serial number${line.quantity > 1 ? ` #${i + 1}` : ''}`}
              />
              <UppercaseInput
                ref={(el) => {
                  imeiRefs.current[i] = el;
                }}
                value={line.imeis[i] ?? ''}
                onChange={(e) => {
                  const imeis = [...line.imeis];
                  imeis[i] = e.target.value;
                  set('imeis', imeis);
                }}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  if (!validateImei(i)) {
                    focusImei(i);
                    return;
                  }
                  if (i + 1 < line.quantity) focusSerial(i + 1);
                }}
                onBlur={() => validateImei(i)}
                placeholder={`IMEI number${line.quantity > 1 ? ` #${i + 1}` : ''} (optional)`}
              />
              <Select
                value={line.colors[i] ?? ''}
                onChange={(e) => {
                  const next = [...line.colors];
                  next[i] = e.target.value;
                  set('colors', next);
                }}
              >
                <option value="">Color{line.quantity > 1 ? ` #${i + 1}` : ''}</option>
                {colors.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <FieldWrap label="Note (optional)">
          <Textarea rows={2} value={line.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any information" />
        </FieldWrap>
      </div>
    </div>
  );
}
