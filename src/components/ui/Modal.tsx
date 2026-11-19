import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  '2xl': 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: keyof typeof SIZE_CLASSES;
  footer?: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={`relative z-10 max-h-[90vh] w-full ${SIZE_CLASSES[size]} overflow-hidden rounded-2xl border border-line bg-surface-raised shadow-popover`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-faint hover:bg-surface hover:text-ink">
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(90vh-130px)] overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}
