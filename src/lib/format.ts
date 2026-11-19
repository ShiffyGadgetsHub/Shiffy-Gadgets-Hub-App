export function formatCurrency(amount: number, symbol = '₦'): string {
  const rounded = Math.round(amount);
  return `${symbol}${rounded.toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 45) return 'just now';
  const units: [number, string][] = [
    [31536000, 'y'],
    [2592000, 'mo'],
    [86400, 'd'],
    [3600, 'h'],
    [60, 'm'],
  ];
  for (const [secs, label] of units) {
    const value = Math.floor(seconds / secs);
    if (value >= 1) return `${value}${label} ago`;
  }
  return 'just now';
}

// How long an item has been out with a customer, counting live (e.g. "2d 4h", "36m").
export function pendingDuration(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 0) return '0m';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

// Strip non-digits and format with thousands commas as the user types, e.g. "1,250,000".
export function formatNumberInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  return Number(digits).toLocaleString('en-NG');
}

export function parseNumberInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
