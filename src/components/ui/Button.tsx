import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'dark' | 'outline' | 'ghost' | 'danger' | 'subtle';
type Size = 'sm' | 'md';

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'bg-brand-500 text-white hover:bg-brand-600 shadow-sm shadow-brand-500/20 disabled:bg-brand-300',
  dark: 'bg-ink text-surface-soft hover:opacity-90 disabled:opacity-50',
  outline: 'border border-line bg-transparent text-ink hover:bg-surface-soft disabled:opacity-50',
  ghost: 'bg-transparent text-ink-soft hover:bg-surface-soft hover:text-ink',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  subtle: 'bg-surface text-ink-soft hover:bg-surface-raised border border-line',
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex shrink-0 items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
