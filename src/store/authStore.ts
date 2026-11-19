import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { StaffUser, UserRole } from '../types';

interface StaffProfileRow {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  active: boolean;
  position: string | null;
  phone: string | null;
  avatar: string | null;
  created_at: string;
}

function mapProfile(row: StaffProfileRow, email: string): StaffUser {
  return {
    id: row.id,
    name: row.name,
    username: row.username,
    email,
    role: row.role,
    active: row.active,
    createdAt: row.created_at,
    position: row.position ?? undefined,
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
  };
}

async function loadProfile(userId: string, email: string): Promise<StaffUser | null> {
  const { data, error } = await supabase.from('staff_profiles').select('*').eq('id', userId).maybeSingle();
  if (error || !data) return null;
  return mapProfile(data as StaffProfileRow, email);
}

interface AuthState {
  currentUserId: string | null;
  profile: StaffUser | null;
  users: StaffUser[];
  ready: boolean;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  currentUser: () => StaffUser | null;

  fetchStaff: () => Promise<void>;
  addStaff: (input: {
    name: string;
    username: string;
    email: string;
    password: string;
    role: UserRole;
    position?: string;
    phone?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateStaff: (
    id: string,
    patch: Partial<Pick<StaffUser, 'name' | 'username' | 'role' | 'active' | 'position' | 'phone' | 'avatar'>>
  ) => Promise<void>;
  resetPassword: (id: string, newPassword: string) => Promise<{ ok: boolean; error?: string }>;
  deleteStaff: (id: string) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  currentUserId: null,
  profile: null,
  users: [],
  ready: false,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await loadProfile(session.user.id, session.user.email ?? '');
      set({ currentUserId: session.user.id, profile });
    }
    set({ ready: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        set({ currentUserId: session.user.id, profile });
      } else {
        set({ currentUserId: null, profile: null, users: [] });
      }
    });
  },

  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) return { ok: false, error: error?.message ?? 'Could not sign in' };

    const profile = await loadProfile(data.user.id, data.user.email ?? '');
    if (!profile) {
      await supabase.auth.signOut();
      return { ok: false, error: 'No staff profile is set up for this account. Contact an admin.' };
    }
    if (!profile.active) {
      await supabase.auth.signOut();
      return { ok: false, error: 'This account has been deactivated' };
    }

    set({ currentUserId: data.user.id, profile });
    return { ok: true };
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ currentUserId: null, profile: null, users: [] });
  },

  currentUser: () => get().profile,

  fetchStaff: async () => {
    const { data, error } = await supabase.from('staff_profiles').select('*').order('created_at', { ascending: true });
    if (error || !data) return;
    set({ users: (data as StaffProfileRow[]).map((row) => mapProfile(row, '')) });
  },

  addStaff: async ({ name, username, email, password, role, position, phone }) => {
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: { action: 'create', email, password, name, username, role, position, phone },
    });
    if (error) return { ok: false, error: error.message };
    if (data?.error) return { ok: false, error: data.error as string };

    await get().fetchStaff();
    return { ok: true };
  },

  updateStaff: async (id, patch) => {
    const { error } = await supabase.from('staff_profiles').update(patch).eq('id', id);
    if (error) return;

    set((state) => ({
      profile: state.currentUserId === id && state.profile ? { ...state.profile, ...patch } : state.profile,
      users: state.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));
  },

  resetPassword: async (id, newPassword) => {
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: { action: 'resetPassword', userId: id, newPassword },
    });
    if (error) return { ok: false, error: error.message };
    if (data?.error) return { ok: false, error: data.error as string };
    return { ok: true };
  },

  deleteStaff: async (id) => {
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: { action: 'delete', userId: id },
    });
    if (error || data?.error) return;
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },
}));
