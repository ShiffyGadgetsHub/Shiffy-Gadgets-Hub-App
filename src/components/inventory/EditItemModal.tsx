import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { FieldWrap, Input, NumberInput, Select, Textarea, SegmentedToggle, UppercaseInput } from '../ui/Field';
import { useInventoryStore } from '../../store/inventoryStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useAuthStore } from '../../store/authStore';
import { useSettingsStore } from '../../store/settingsStore';
import { formatNumberInput, parseNumberInput } from '../../lib/format';
import type { Condition, InventoryItem } from '../../types';

export default function EditItemModal({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const updateItem = useInventoryStore((s) => s.updateItem);
  const user = useAuthStore((s) => s.currentUser());
  const categories = useCatalogStore((s) => s.categories);
  const brandsFor = useCatalogStore((s) => s.brandsFor);
  const colors = useCatalogStore((s) => s.colors);
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);

  const [form, setForm] = useState<InventoryItem | null>(null);

  useEffect(() => setForm(item), [item]);

  if (!form) return null;

  function set<K extends keyof InventoryItem>(key: K, value: InventoryItem[K]) {
    setForm((f) => (f ? { ...f, [key]: value } : f));
  }

  function submit() {
    if (!form || !item) return;
    updateItem(
      item.id,
      {
        name: form.name,
        category: form.category,
        brand: form.brand,
        condition: form.condition,
        color: form.color,
        costPrice: form.costPrice,
        sellingPrice: form.sellingPrice,
        supplier: form.supplier,
        serialNumber: form.serialNumber.toUpperCase(),
        imei: form.imei?.toUpperCase(),
        notes: form.notes,
      },
      user?.name ?? 'Staff'
    );
    onClose();
  }

  return (
    <Modal open={!!item} onClose={onClose} title={`Edit — ${item?.name}`} size="lg" footer={
      <>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={submit}>Save Changes</Button>
      </>
    }>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FieldWrap label="Item name" required>
          <Input value={form.name} onChange={(e) => set('name', e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Condition" required>
          <SegmentedToggle options={[{ label: 'Used', value: 'Used' }, { label: 'New', value: 'New' }]} value={form.condition} onChange={(v) => set('condition', v as Condition)} />
        </FieldWrap>
        <FieldWrap label="Category" required>
          <Select value={form.category} onChange={(e) => set('category', e.target.value)}>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </Select>
        </FieldWrap>
        <FieldWrap label="Brand" required>
          <Select value={form.brand} onChange={(e) => set('brand', e.target.value)}>
            {brandsFor(form.category).map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
            {!brandsFor(form.category).includes(form.brand) && <option value={form.brand}>{form.brand}</option>}
          </Select>
        </FieldWrap>
        <FieldWrap label="Serial number" required>
          <UppercaseInput value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} />
        </FieldWrap>
        <FieldWrap label="IMEI number">
          <UppercaseInput value={form.imei ?? ''} onChange={(e) => set('imei', e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Cost price" required>
          <NumberInput prefix={currencySymbol} value={String(form.costPrice.toLocaleString())} onValueChange={(v) => set('costPrice', parseNumberInput(formatNumberInput(v)))} />
        </FieldWrap>
        <FieldWrap label="Sales price" required>
          <NumberInput prefix={currencySymbol} value={String(form.sellingPrice.toLocaleString())} onValueChange={(v) => set('sellingPrice', parseNumberInput(formatNumberInput(v)))} />
        </FieldWrap>
        <FieldWrap label="Supplier">
          <Input value={form.supplier} onChange={(e) => set('supplier', e.target.value)} />
        </FieldWrap>
        <FieldWrap label="Color">
          <Select value={form.color} onChange={(e) => set('color', e.target.value)}>
            {colors.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FieldWrap>
        <div className="sm:col-span-2">
          <FieldWrap label="Note (optional)">
            <Textarea rows={2} value={form.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
          </FieldWrap>
        </div>
      </div>
    </Modal>
  );
}
