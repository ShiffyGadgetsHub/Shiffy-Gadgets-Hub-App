import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Boxes, Sparkles, History, Search, Plus, Download, PackageX, Smartphone, CreditCard } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useCatalogStore } from '../store/catalogStore';
import { getItemsInStock } from '../lib/stats';
import { groupStock } from '../lib/grouping';
import { exportToExcel } from '../lib/export';
import { useBasePath } from '../lib/useBasePath';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import FilterSelect from '../components/ui/FilterSelect';
import ProductIcon from '../components/ui/ProductIcon';
import EmptyState from '../components/ui/EmptyState';
import Badge, { conditionTone, simTypeTone } from '../components/ui/Badge';

export default function StockPage() {
  const navigate = useNavigate();
  const base = useBasePath();
  const items = useInventoryStore((s) => s.items);
  const categories = useCatalogStore((s) => s.categories);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [simType, setSimType] = useState('All');

  const inStock = useMemo(() => getItemsInStock(items), [items]);
  const newCount = inStock.filter((i) => i.condition === 'New').length;
  const usedCount = inStock.length - newCount;
  const esimCount = inStock.filter((i) => i.simType === 'eSIM').length;
  const psCount = inStock.filter((i) => i.simType === 'PS').length;

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groupStock(inStock).filter((g) => {
      if (category !== 'All' && g.category !== category) return false;
      if (condition !== 'All' && g.condition !== condition) return false;
      if (simType !== 'All' && g.simType !== simType) return false;
      if (q && !g.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [inStock, search, category, condition, simType]);

  function handleExport() {
    exportToExcel(
      'gadgetstock-stock',
      'Stock',
      groups.map((g) => ({
        'Product Name': g.name,
        Condition: g.condition,
        'SIM Type': g.simType ?? '',
        Category: g.category,
        'Unit In Stock': g.count,
      }))
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Stock" subtitle="Units currently available, grouped by product and condition." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Items in Stock" value={inStock.length} icon={Boxes} tone="brand" />
        <StatCard label="New Items in stock" value={newCount} icon={Sparkles} tone="emerald" />
        <StatCard label="Used Items in stock" value={usedCount} icon={History} tone="violet" />
        <StatCard label="eSIM Phones in stock" value={esimCount} icon={Smartphone} tone="brand" />
        <StatCard label="PS Phones in stock" value={psCount} icon={CreditCard} tone="violet" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search product name…"
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
          <FilterSelect value={simType} onChange={(e) => setSimType(e.target.value)}>
            <option value="All">All SIM Types</option>
            <option value="eSIM">eSIM</option>
            <option value="PS">PS</option>
          </FilterSelect>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" icon={<Download size={15} />} onClick={handleExport}>
              Export
            </Button>
            <Button variant="dark" icon={<Plus size={15} />} onClick={() => navigate(`${base}/add-stock`)}>
              Add Stock
            </Button>
          </div>
        </div>
      </Card>

      {groups.length === 0 ? (
        <EmptyState icon={PackageX} title="No stock found" message="Try adjusting your search or filters." />
      ) : (
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b-2 border-line bg-surface text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-5 py-3 font-semibold">Product Name</th>
                  <th className="px-5 py-3 font-semibold">Condition</th>
                  <th className="px-5 py-3 font-semibold">SIM Type</th>
                  <th className="px-5 py-3 font-semibold">Category</th>
                  <th className="px-5 py-3 font-semibold">Unit In Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {groups.map((g) => (
                  <tr key={g.key} className="hover:bg-surface/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <ProductIcon category={g.category} size="sm" />
                        <p className="font-medium text-ink">{g.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={conditionTone(g.condition)}>{g.condition}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      {g.simType ? <Badge tone={simTypeTone(g.simType)}>{g.simType}</Badge> : <span className="text-ink-faint">—</span>}
                    </td>
                    <td className="px-5 py-3 text-ink-soft">{g.category}</td>
                    <td className="px-5 py-3 font-semibold text-ink">{g.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
