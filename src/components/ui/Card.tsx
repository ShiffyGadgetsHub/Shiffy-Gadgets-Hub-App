import type { ReactNode } from 'react';

export default function Card({ children, className = '', padded = true }: { children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <div className={`rounded-2xl border border-line bg-surface-raised shadow-card ${padded ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
}
