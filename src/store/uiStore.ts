import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';

interface UIState {
  theme: Theme;
  sidebarCollapsed: boolean;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  toggleSidebar: () => void;
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      sidebarCollapsed: false,
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light';
        applyTheme(next);
        set({ theme: next });
      },
      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },
      toggleSidebar: () => set({ sidebarCollapsed: !get().sidebarCollapsed }),
    }),
    {
      name: 'gadgetstock-ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
