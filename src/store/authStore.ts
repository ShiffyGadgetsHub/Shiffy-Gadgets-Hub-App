import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/id';
import { hashPassword } from '../lib/auth';
import type { StaffUser, UserRole } from '../types';

interface AuthState {
  users: StaffUser[];
  currentUserId: string | null;
  seeded: boolean;

  ensureSeeded: () => Promise<void>;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  currentUser: () => StaffUser | null;
  addStaff: (input: {
    name: string;
    username: string;
    password: string;
    role: UserRole;
    position?: string;
    phone?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateStaff: (
    id: string,
    patch: Partial<Pick<StaffUser, 'name' | 'username' | 'role' | 'active' | 'position' | 'phone' | 'avatar'>>
  ) => void;
  resetPassword: (id: string, newPassword: string) => Promise<void>;
  deleteStaff: (id: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      users: [],
      currentUserId: null,
      seeded: false,

      ensureSeeded: async () => {
        if (get().seeded && get().users.length > 0) return;
        const passwordHash = await hashPassword('admin123');
        const admin: StaffUser = {
          id: generateId('usr'),
          name: 'Brother Sheriff',
          username: 'admin',
          passwordHash,
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
          position: 'Store Administrator',
          phone: '08012345678',
        };
        set({ users: [admin], seeded: true });
      },

      login: async (username, password) => {
        const hash = await hashPassword(password);
        const user = get().users.find(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (!user) return { ok: false, error: 'User not found' };
        if (!user.active) return { ok: false, error: 'This account has been deactivated' };
        if (user.passwordHash !== hash) return { ok: false, error: 'Incorrect password' };
        set({ currentUserId: user.id });
        return { ok: true };
      },

      logout: () => set({ currentUserId: null }),

      currentUser: () => {
        const { users, currentUserId } = get();
        return users.find((u) => u.id === currentUserId) ?? null;
      },

      addStaff: async ({ name, username, password, role, position, phone }) => {
        const exists = get().users.some(
          (u) => u.username.toLowerCase() === username.trim().toLowerCase()
        );
        if (exists) return { ok: false, error: 'Username already taken' };
        const passwordHash = await hashPassword(password);
        const newUser: StaffUser = {
          id: generateId('usr'),
          name,
          username: username.trim(),
          passwordHash,
          role,
          active: true,
          createdAt: new Date().toISOString(),
          position,
          phone,
        };
        set({ users: [...get().users, newUser] });
        return { ok: true };
      },

      updateStaff: (id, patch) => {
        set({
          users: get().users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        });
      },

      resetPassword: async (id, newPassword) => {
        const passwordHash = await hashPassword(newPassword);
        set({
          users: get().users.map((u) => (u.id === id ? { ...u, passwordHash } : u)),
        });
      },

      deleteStaff: (id) => {
        set({ users: get().users.filter((u) => u.id !== id) });
      },
    }),
    { name: 'gadgetstock-auth-v2' }
  )
);
