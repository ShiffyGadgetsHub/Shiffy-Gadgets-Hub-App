import type { LucideIcon } from 'lucide-react';
import Card from './Card';

type Tone = 'brand' | 'amber' | 'rose' | 'emerald' | 'violet' | 'pink';

const TONE_CLASSES: Record<Tone, string> = {
  brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400',
  pink: 'bg-accent-50 text-accent-600 dark:bg-accent-500/10 dark:text-accent-400',
};

export default function StatCard({
  label,
  value,
  sublabel,
  icon: Icon,
  tone = 'brand',
}: {
  label: string;
  value: string | number;
  sublabel?: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <Card className="flex items-start justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-ink-soft">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
        {sublabel && <p className="mt-1 truncate text-xs text-ink-faint">{sublabel}</p>}
      </div>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${TONE_CLASSES[tone]}`}>
        <Icon size={20} />
      </div>
    </Card>
  );
}
