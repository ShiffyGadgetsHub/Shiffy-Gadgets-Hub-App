import { create } from 'zustand';
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

interface PushRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  message: string;
  context: PushMessage['context'];
  sent_at: string;
  sent_by: string;
}

function mapPush(r: PushRow): PushMessage {
  return {
    id: r.id,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    message: r.message,
    context: r.context,
    sentAt: r.sent_at,
    sentBy: r.sent_by,
  };
}

let activitySubscribed = false;

interface NotificationState {
  inbox: InboxMessage[];
  outbox: PushMessage[];

  loadInbox: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  markManyRead: (ids: string[]) => Promise<void>;
  unreadCount: () => number;

  loadOutbox: () => Promise<void>;
  sendPush: (input: Omit<PushMessage, 'id' | 'sentAt'>) => Promise<void>;
  logActivity: (subject: string, body: string, from: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  inbox: [],
  outbox: [],

  loadInbox: async () => {
    const { data, error } = await supabase.from('activity_log').select('*').order('sent_at', { ascending: false });
    if (!error && data) {
      set({ inbox: (data as ActivityRow[]).map(mapActivity) });
    }

    if (activitySubscribed) return;
    activitySubscribed = true;
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

  loadOutbox: async () => {
    const { data, error } = await supabase.from('push_messages').select('*').order('sent_at', { ascending: false });
    if (!error && data) {
      set({ outbox: (data as PushRow[]).map(mapPush) });
    }
  },

  sendPush: async (input) => {
    const { data, error } = await supabase
      .from('push_messages')
      .insert({
        customer_name: input.customerName,
        customer_phone: input.customerPhone,
        message: input.message,
        context: input.context,
        sent_by: input.sentBy,
      })
      .select()
      .single();
    if (!error && data) {
      set({ outbox: [mapPush(data as PushRow), ...get().outbox] });
    }
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
}));
