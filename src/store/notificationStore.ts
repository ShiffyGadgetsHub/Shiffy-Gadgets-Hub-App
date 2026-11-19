import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/id';
import { supabase } from '../lib/supabaseClient';
import type { InboxMessage, PushMessage } from '../types';

interface ActivityRow {
  id: string;
  from_name: string;
  subject: string;
  body: string;
  sent_at: string;
  read: boolean;
}

function mapActivity(r: ActivityRow): InboxMessage {
  return { id: r.id, from: r.from_name, subject: r.subject, body: r.body, sentAt: r.sent_at, read: r.read };
}

let subscribed = false;

interface NotificationState {
  inbox: InboxMessage[];
  outbox: PushMessage[];

  loadInbox: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  markManyRead: (ids: string[]) => Promise<void>;
  unreadCount: () => number;
  sendPush: (input: Omit<PushMessage, 'id' | 'sentAt'>) => void;
  logActivity: (subject: string, body: string, from: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      inbox: [],
      outbox: [],

      loadInbox: async () => {
        const { data, error } = await supabase.from('activity_log').select('*').order('sent_at', { ascending: false });
        if (!error && data) {
          set({ inbox: (data as ActivityRow[]).map(mapActivity) });
        }

        if (subscribed) return;
        subscribed = true;
        supabase
          .channel('activity_log_inserts')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, (payload) => {
            const row = mapActivity(payload.new as ActivityRow);
            set((state) => (state.inbox.some((m) => m.id === row.id) ? state : { inbox: [row, ...state.inbox] }));
          })
          .subscribe();
      },

      markRead: async (id) => {
        set({ inbox: get().inbox.map((m) => (m.id === id ? { ...m, read: true } : m)) });
        await supabase.from('activity_log').update({ read: true }).eq('id', id);
      },

      markAllRead: async () => {
        const ids = get().inbox.filter((m) => !m.read).map((m) => m.id);
        await get().markManyRead(ids);
      },

      markManyRead: async (ids) => {
        if (ids.length === 0) return;
        const idSet = new Set(ids);
        set({ inbox: get().inbox.map((m) => (idSet.has(m.id) ? { ...m, read: true } : m)) });
        await supabase.from('activity_log').update({ read: true }).in('id', ids);
      },

      unreadCount: () => get().inbox.filter((m) => !m.read).length,

      sendPush: (input) => {
        set({
          outbox: [{ ...input, id: generateId('push'), sentAt: new Date().toISOString() }, ...get().outbox],
        });
      },

      logActivity: async (subject, body, from) => {
        const { data, error } = await supabase
          .from('activity_log')
          .insert({ from_name: from, subject, body })
          .select()
          .single();
        if (!error && data) {
          const row = mapActivity(data as ActivityRow);
          set((state) => (state.inbox.some((m) => m.id === row.id) ? state : { inbox: [row, ...state.inbox] }));
        }
      },
    }),
    { name: 'gadgetstock-notifications', partialize: (state) => ({ outbox: state.outbox }) }
  )
);
