import { forwardRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { formatNumberInput } from '../../lib/format';

export const inputClass =
  'w-full rounded-lg border border-line bg-surface-soft px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/20 disabled:opacity-60';

export function Label({ children, required }: { children: ReactNode; required?: boolean }) {
  return (
    <label className="mb-1.5 block text-sm font-medium text-ink">
      {children}
      {required && <span className="ml-0.5 text-rose-500">*</span>}
    </label>
  );
}

export function FieldWrap({ label, required, children, hint }: { label?: string; required?: boolean; children: ReactNode; hint?: string }) {
  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {children}
      {hint && <p className="mt-1 text-xs text-ink-faint">{hint}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <input ref={ref} {...props} className={`${inputClass} ${props.className ?? ''}`} />;
});

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} resize-none ${props.className ?? ''}`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`${inputClass} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%239598a8" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pr-9 ${props.className ?? ''}`}
    />
  );
}

export const UppercaseInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function UppercaseInput(props, ref) {
  return <Input ref={ref} {...props} style={{ textTransform: 'uppercase' }} />;
});

export function NumberInput({
  value,
  onValueChange,
  prefix,
  ...rest
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (formatted: string) => void;
  prefix?: string;
}) {
  return (
    <div className="relative">
      {prefix && <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink-faint">{prefix}</span>}
      <Input
        {...rest}
        inputMode="numeric"
        value={value}
        onChange={(e) => onValueChange(formatNumberInput(e.target.value))}
        className={prefix ? 'pl-8' : ''}
      />
    </div>
  );
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-line bg-surface-soft p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            value === opt.value ? 'bg-ink text-surface-soft' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
