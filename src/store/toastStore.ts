import { create } from 'zustand';
import { generateId } from '../lib/id';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  tone?: 'success' | 'info' | 'warning';
}

interface ToastState {
  toasts: ToastItem[];
  push: (toast: Omit<ToastItem, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = generateId('toast');
    set({ toasts: [...get().toasts, { tone: 'success', ...toast, id }] });
    setTimeout(() => get().dismiss(id), 6000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
