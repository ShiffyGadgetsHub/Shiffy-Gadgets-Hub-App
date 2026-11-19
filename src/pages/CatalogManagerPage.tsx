import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useCatalogStore } from '../store/catalogStore';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { FieldWrap, Input, Select } from '../components/ui/Field';

type Tab = 'categories' | 'brands' | 'items';

export default function CatalogManagerPage() {
  const navigate = useNavigate();
  const categories = useCatalogStore((s) => s.categories);
  const brands = useCatalogStore((s) => s.brands);
  const itemNames = useCatalogStore((s) => s.itemNames);
  const addCategory = useCatalogStore((s) => s.addCategory);
  const deleteCategory = useCatalogStore((s) => s.deleteCategory);
  const addBrand = useCatalogStore((s) => s.addBrand);
  const deleteBrand = useCatalogStore((s) => s.deleteBrand);
  const addItemName = useCatalogStore((s) => s.addItemName);
  const deleteItemName = useCatalogStore((s) => s.deleteItemName);
  const brandsFor = useCatalogStore((s) => s.brandsFor);

  const [tab, setTab] = useState<Tab>('categories');
  const [error, setError] = useState('');

  const [newCategory, setNewCategory] = useState('');
  const [brandCategory, setBrandCategory] = useState(categories[0]?.name ?? '');
  const [newBrand, setNewBrand] = useState('');
  const [itemCategory, setItemCategory] = useState(categories[0]?.name ?? '');
  const [itemBrand, setItemBrand] = useState('');
  const [newItemName, setNewItemName] = useState('');

  const brandOptions = useMemo(() => brandsFor(itemCategory), [brandsFor, itemCategory]);

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: 'categories', label: 'Categories', count: categories.length },
    { id: 'brands', label: 'Brands', count: brands.length },
    { id: 'items', label: 'Item Names', count: itemNames.length },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manage Catalog"
        subtitle="Add, edit or remove the categories, brands and item names used throughout Shiffy Gadgets Hub."
        actions={
          <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={() => navigate('/admin/category')}>
            Back to Category
          </Button>
        }
      />

      <div className="flex gap-2 border-b border-line">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setError('');
            }}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            {t.label}
            <span className="rounded-full bg-surface px-1.5 py-0.5 text-xs text-ink-faint">{t.count}</span>
          </button>
        ))}
      </div>

      {tab === 'categories' && (
        <Card>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await addCategory(newCategory);
              if (!res.ok) setError(res.error ?? 'Could not add category');
              else {
                setNewCategory('');
                setError('');
              }
            }}
          >
            <div className="min-w-[220px] flex-1">
              <FieldWrap label="New category name">
                <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="e.g. Smart Home" />
              </FieldWrap>
            </div>
            <Button type="submit" icon={<Plus size={15} />}>Add Category</Button>
          </form>
          {error && tab === 'categories' && <p className="mt-2 text-sm text-rose-600">{error}</p>}

          <div className="mt-5 divide-y divide-line border-t border-line">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{c.name}</p>
                  <p className="text-xs text-ink-faint">{brandsFor(c.name).length} brands</p>
                </div>
                <button onClick={() => deleteCategory(c.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'brands' && (
        <Card>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await addBrand(brandCategory, newBrand);
              if (!res.ok) setError(res.error ?? 'Could not add brand');
              else {
                setNewBrand('');
                setError('');
              }
            }}
          >
            <div className="min-w-[180px]">
              <FieldWrap label="Category">
                <Select value={brandCategory} onChange={(e) => setBrandCategory(e.target.value)}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </FieldWrap>
            </div>
            <div className="min-w-[220px] flex-1">
              <FieldWrap label="New brand name">
                <Input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="e.g. Xiaomi" />
              </FieldWrap>
            </div>
            <Button type="submit" icon={<Plus size={15} />}>Add Brand</Button>
          </form>
          {error && tab === 'brands' && <p className="mt-2 text-sm text-rose-600">{error}</p>}

          <div className="mt-5 grid grid-cols-1 gap-x-6 divide-y divide-line border-t border-line sm:grid-cols-2">
            {brands.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-ink">{b.name}</p>
                  <p className="text-xs text-ink-faint">{b.category}</p>
                </div>
                <button onClick={() => deleteBrand(b.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'items' && (
        <Card>
          <form
            className="flex flex-wrap items-end gap-3"
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await addItemName(itemCategory, itemBrand || brandOptions[0], newItemName);
              if (!res.ok) setError(res.error ?? 'Could not add item name');
              else {
                setNewItemName('');
                setError('');
              }
            }}
          >
            <div className="min-w-[160px]">
              <FieldWrap label="Category">
                <Select value={itemCategory} onChange={(e) => { setItemCategory(e.target.value); setItemBrand(''); }}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </FieldWrap>
            </div>
            <div className="min-w-[160px]">
              <FieldWrap label="Brand">
                <Select value={itemBrand || brandOptions[0] || ''} onChange={(e) => setItemBrand(e.target.value)}>
                  {brandOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </FieldWrap>
            </div>
            <div className="min-w-[220px] flex-1">
              <FieldWrap label="New item name">
                <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. iPhone 17 Pro Max 1TB" />
              </FieldWrap>
            </div>
            <Button type="submit" icon={<Plus size={15} />}>Add Item</Button>
          </form>
          {error && tab === 'items' && <p className="mt-2 text-sm text-rose-600">{error}</p>}

          <div className="mt-5 max-h-96 divide-y divide-line overflow-y-auto border-t border-line">
            {itemNames.map((n) => (
              <div key={n.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-ink">{n.name}</p>
                  <p className="text-xs text-ink-faint">{n.category} · {n.brand}</p>
                </div>
                <button onClick={() => deleteItemName(n.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
