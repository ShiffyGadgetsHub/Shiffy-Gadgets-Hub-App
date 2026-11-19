import { PartyPopper, Info, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '../../store/toastStore';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="toast-enter pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface-raised p-4 shadow-popover"
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              t.tone === 'info'
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400'
                : t.tone === 'warning'
                ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
            }`}
          >
            {t.tone === 'info' ? <Info size={18} /> : t.tone === 'warning' ? <AlertTriangle size={18} /> : <PartyPopper size={18} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-ink">{t.title}</p>
            {t.message && <p className="mt-0.5 text-sm text-ink-soft">{t.message}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-lg p-1 text-ink-faint hover:bg-surface hover:text-ink">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
