import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FilterSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        {...props}
        className={`h-10 appearance-none rounded-lg border border-line bg-surface-soft py-2 pl-3.5 pr-8 text-sm font-medium text-ink outline-none focus:border-brand-400 ${props.className ?? ''}`}
      />
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint" />
    </div>
  );
}
