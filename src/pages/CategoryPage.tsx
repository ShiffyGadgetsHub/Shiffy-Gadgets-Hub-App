import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tags, Layers3, Package, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useCatalogStore } from '../store/catalogStore';
import { formatDate } from '../lib/format';
import PageHeader from '../components/ui/PageHeader';
import StatCard from '../components/ui/StatCard';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import Modal from '../components/ui/Modal';
import { FieldWrap, Input } from '../components/ui/Field';

export default function CategoryPage() {
  const navigate = useNavigate();
  const categories = useCatalogStore((s) => s.categories);
  const brands = useCatalogStore((s) => s.brands);
  const itemNames = useCatalogStore((s) => s.itemNames);
  const updateCategory = useCatalogStore((s) => s.updateCategory);
  const deleteCategory = useCatalogStore((s) => s.deleteCategory);

  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories.filter((c) => !q || c.name.toLowerCase().includes(q));
  }, [categories, search]);

  return (
    <div className="space-y-5">
      <PageHeader title="Category" subtitle="Manage the categories and brands used across your catalog." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Categories" value={categories.length} icon={Tags} tone="brand" />
        <StatCard label="Total Brands" value={brands.length} icon={Layers3} tone="violet" />
        <StatCard label="Total Items" value={itemNames.length} icon={Package} tone="emerald" />
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[200px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search category…"
              className="h-10 w-full rounded-lg border border-line bg-surface-soft pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-400"
            />
          </div>
          <Button variant="dark" icon={<Plus size={15} />} onClick={() => navigate('/admin/category/manage')} className="ml-auto">
            Add Category
          </Button>
        </div>
      </Card>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-line bg-surface text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Category Slug</th>
                <th className="px-5 py-3 font-semibold">Created On</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-surface/60">
                  <td className="px-5 py-3 font-medium text-ink">{c.name}</td>
                  <td className="px-5 py-3 text-ink-soft">{c.slug}</td>
                  <td className="px-5 py-3 text-ink-soft">{formatDate(c.createdOn)}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => updateCategory(c.id, { active: !c.active })}>
                      <Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'Active' : 'Inactive'}</Badge>
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <button onClick={() => setEditTarget({ id: c.id, name: c.name })} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface hover:text-ink">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => setDeleteTarget({ id: c.id, name: c.name })} className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-faint">No categories found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit category"
        footer={
          <Button
            onClick={() => {
              if (editTarget) updateCategory(editTarget.id, { name: editTarget.name });
              setEditTarget(null);
            }}
          >
            Save
          </Button>
        }
      >
        <FieldWrap label="Category name" required>
          <Input value={editTarget?.name ?? ''} onChange={(e) => setEditTarget((t) => (t ? { ...t, name: e.target.value } : t))} />
        </FieldWrap>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete category"
        message={`Delete "${deleteTarget?.name}"? Its brands and item names will also be removed.`}
        confirmLabel="Delete"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteCategory(deleteTarget.id);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
