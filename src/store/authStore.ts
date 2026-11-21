import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useToastStore } from './toastStore';
import type { StaffUser, UserRole } from '../types';

/**
 * supabase.functions.invoke() only gives a generic "non-2xx status code"
 * message on error — the function's actual JSON error body is on
 * error.context (a Response) and has to be read separately.
 */
async function functionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object' && 'context' in error) {
    const context = (error as { context?: Response }).context;
    if (context) {
      try {
        const body = await context.json();
        if (body?.error) return body.error as string;
      } catch {
        // fall through to generic message below
      }
    }
  }
  return error instanceof Error ? error.message : fallback;
}

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

/**
 * Listens for this signed-in user's own staff_profiles row being
 * deactivated by an admin elsewhere, and signs them out immediately
 * instead of waiting for their next login attempt.
 */
let ownProfileChannel: ReturnType<typeof supabase.channel> | null = null;

function watchOwnProfile(userId: string, onDeactivated: () => void) {
  if (ownProfileChannel) {
    supabase.removeChannel(ownProfileChannel);
    ownProfileChannel = null;
  }
  ownProfileChannel = supabase
    .channel(`own-profile-${userId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'staff_profiles', filter: `id=eq.${userId}` },
      (payload) => {
        const row = payload.new as StaffProfileRow;
        if (!row.active) onDeactivated();
      }
    )
    .subscribe();
}

function stopWatchingOwnProfile() {
  if (ownProfileChannel) {
    supabase.removeChannel(ownProfileChannel);
    ownProfileChannel = null;
  }
}

interface AuthState {
  currentUserId: string | null;
  profile: StaffUser | null;
  users: StaffUser[];
  ready: boolean;
  forcedLogoutReason: string | null;

  init: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  currentUser: () => StaffUser | null;
  clearForcedLogoutReason: () => void;

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
  forcedLogoutReason: null,

  init: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await loadProfile(session.user.id, session.user.email ?? '');
      set({ currentUserId: session.user.id, profile });
      if (profile) {
        watchOwnProfile(session.user.id, () => {
          set({ forcedLogoutReason: 'Your account has been deactivated. Contact your administrator for help.' });
          supabase.auth.signOut().then(() => set({ currentUserId: null, profile: null, users: [] }));
        });
      }
    }
    set({ ready: true });

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await loadProfile(session.user.id, session.user.email ?? '');
        set({ currentUserId: session.user.id, profile });
        if (profile) {
          watchOwnProfile(session.user.id, () => {
            set({ forcedLogoutReason: 'Your account has been deactivated. Contact your administrator for help.' });
            supabase.auth.signOut().then(() => set({ currentUserId: null, profile: null, users: [] }));
          });
        }
      } else {
        stopWatchingOwnProfile();
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
      return { ok: false, error: 'This account has been deactivated. Contact your administrator for help.' };
    }

    set({ currentUserId: data.user.id, profile });
    return { ok: true };
  },

  logout: async () => {
    stopWatchingOwnProfile();
    await supabase.auth.signOut();
    set({ currentUserId: null, profile: null, users: [] });
  },

  currentUser: () => get().profile,

  clearForcedLogoutReason: () => set({ forcedLogoutReason: null }),

  fetchStaff: async () => {
    const { data, error } = await supabase.from('staff_profiles').select('*').order('created_at', { ascending: true });
    if (error || !data) return;
    set({ users: (data as StaffProfileRow[]).map((row) => mapProfile(row, '')) });
  },

  addStaff: async ({ name, username, email, password, role, position, phone }) => {
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: { action: 'create', email, password, name, username, role, position, phone },
    });
    if (error) return { ok: false, error: await functionErrorMessage(error, 'Could not add staff') };
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
    if (error) return { ok: false, error: await functionErrorMessage(error, 'Could not reset password') };
    if (data?.error) return { ok: false, error: data.error as string };
    return { ok: true };
  },

  deleteStaff: async (id) => {
    const { data, error } = await supabase.functions.invoke('manage-staff', {
      body: { action: 'delete', userId: id },
    });
    if (error || data?.error) {
      const message = error ? await functionErrorMessage(error, 'Could not remove staff') : (data.error as string);
      useToastStore.getState().push({ title: 'Could not remove staff', message, tone: 'warning' });
      return;
    }
    set((state) => ({ users: state.users.filter((u) => u.id !== id) }));
  },
}));
