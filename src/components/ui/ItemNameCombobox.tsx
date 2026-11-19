import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useCatalogStore } from '../../store/catalogStore';
import { inputClass } from './Field';
import type { ItemNameRecord } from '../../types';

export default function ItemNameCombobox({
  value,
  category,
  brand,
  onSelect,
  onTextChange,
}: {
  value: string;
  category?: string;
  brand?: string;
  onSelect: (record: ItemNameRecord) => void;
  onTextChange: (text: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const itemNames = useCatalogStore((s) => s.itemNames);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const query = value.trim().toLowerCase();
  const matches = query
    ? itemNames
        .filter((n) => {
          if (category && n.category !== category) return false;
          if (brand && n.brand !== brand) return false;
          return n.name.toLowerCase().includes(query);
        })
        .slice(0, 30)
    : [];

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
        <input
          value={value}
          onChange={(e) => {
            onTextChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search item name, e.g. iPhone 15 Pro Max 256GB"
          className={`${inputClass} pl-9`}
        />
      </div>
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1.5 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-surface-raised py-1 shadow-popover">
          {matches.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => {
                onSelect(m);
                setOpen(false);
              }}
              className="flex w-full flex-col items-start px-3.5 py-2 text-left hover:bg-surface"
            >
              <span className="text-sm text-ink">{m.name}</span>
              <span className="text-xs text-ink-faint">
                {m.category} · {m.brand}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
