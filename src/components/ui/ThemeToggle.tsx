import { Sun, Moon } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';

export default function ThemeToggle() {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft transition-colors hover:bg-surface hover:text-ink"
    >
      {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
