import { useEffect, useRef, useState } from 'react';
import { MoreVertical, type LucideIcon } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

export default function ActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-faint hover:bg-surface hover:text-ink"
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-48 overflow-hidden rounded-xl border border-line bg-surface-raised py-1.5 shadow-popover">
          {items.map(({ label, icon: Icon, onClick, danger }) => (
            <button
              key={label}
              onClick={() => {
                setOpen(false);
                onClick();
              }}
              className={`flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-surface ${
                danger ? 'text-rose-600' : 'text-ink'
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
