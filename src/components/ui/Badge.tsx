type Tone = 'green' | 'red' | 'amber' | 'blue' | 'gray' | 'violet' | 'pink';

const TONE_CLASSES: Record<Tone, string> = {
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
  red: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  blue: 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  gray: 'bg-gray-100 text-gray-600 dark:bg-white/5 dark:text-gray-300',
  violet: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400',
  pink: 'bg-accent-50 text-accent-700 dark:bg-accent-500/10 dark:text-accent-400',
};

const DOT_CLASSES: Record<Tone, string> = {
  green: 'bg-emerald-500',
  red: 'bg-rose-500',
  amber: 'bg-amber-500',
  blue: 'bg-blue-500',
  gray: 'bg-gray-400',
  violet: 'bg-violet-500',
  pink: 'bg-accent-500',
};

export default function Badge({ tone = 'gray', children, dot = true }: { tone?: Tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${TONE_CLASSES[tone]}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[tone]}`} />}
      {children}
    </span>
  );
}

export function paymentStatusTone(status: 'unpaid' | 'partial' | 'paid'): Tone {
  if (status === 'paid') return 'green';
  if (status === 'partial') return 'amber';
  return 'red';
}

export function itemStatusTone(status: 'in_stock' | 'out' | 'sold'): Tone {
  if (status === 'in_stock') return 'green';
  if (status === 'out') return 'amber';
  return 'blue';
}

export function transactionStatusTone(status: 'with_customer' | 'returned' | 'completed'): Tone {
  if (status === 'completed') return 'green';
  if (status === 'returned') return 'blue';
  return 'amber';
}

export function conditionTone(condition: 'New' | 'Used'): Tone {
  return condition === 'New' ? 'green' : 'pink';
}
