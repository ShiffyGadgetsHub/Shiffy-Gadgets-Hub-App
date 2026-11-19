import { useEffect, useMemo, useRef, useState } from 'react';
import { User } from 'lucide-react';
import { useInventoryStore } from '../../store/inventoryStore';
import { getKnownCustomers } from '../../lib/stats';
import { inputClass } from './Field';

export default function CustomerNameCombobox({
  value,
  onTextChange,
  onSelect,
  placeholder,
}: {
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (customer: { name: string; phone: string }) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const transactions = useInventoryStore((s) => s.transactions);
  const knownCustomers = useMemo(() => getKnownCustomers(transactions), [transactions]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const query = value.trim().toLowerCase();
  const matches = query ? knownCustomers.filter((c) => c.name.toLowerCase().includes(query)).slice(0, 6) : [];

  return (
    <div className="relative" ref={wrapRef}>
      <input
        value={value}
        onChange={(e) => {
          const text = e.target.value;
          onTextChange(text);
          setOpen(true);
          const exact = knownCustomers.find((c) => c.name.toLowerCase() === text.trim().toLowerCase());
          if (exact) onSelect(exact);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder ?? 'e.g. Tunde Bakare'}
        className={inputClass}
      />
      {open && matches.length > 0 && (
        <div className="absolute z-20 mt-1.5 max-h-56 w-full overflow-y-auto rounded-lg border border-line bg-surface-raised py-1 shadow-popover">
          {matches.map((c) => (
            <button
              type="button"
              key={c.name.toLowerCase()}
              onClick={() => {
                onSelect(c);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-surface"
            >
              <User size={14} className="shrink-0 text-ink-faint" />
              <span className="min-w-0 flex-1 truncate text-sm text-ink">{c.name}</span>
              <span className="shrink-0 text-xs text-ink-faint">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
