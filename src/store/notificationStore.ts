import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/id';
import type { InboxMessage, PushMessage } from '../types';

interface NotificationState {
  inbox: InboxMessage[];
  outbox: PushMessage[];
  seeded: boolean;

  seedIfEmpty: () => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  markManyRead: (ids: string[]) => void;
  unreadCount: () => number;
  sendPush: (input: Omit<PushMessage, 'id' | 'sentAt'>) => void;
  logActivity: (subject: string, body: string, from: string) => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      inbox: [],
      outbox: [],
      seeded: false,

      seedIfEmpty: () => {
        if (get().seeded) return;
        const hoursAgo = (n: number) => new Date(Date.now() - n * 3600 * 1000).toISOString();
        set({
          inbox: [
            {
              id: generateId('msg'),
              from: 'Super Admin',
              subject: 'Welcome to Shiffy Gadgets Hub',
              body: 'Your store dashboard is live. Reach out to support if you need help setting up staff accounts.',
              sentAt: hoursAgo(72),
              read: true,
            },
            {
              id: generateId('msg'),
              from: 'Super Admin',
              subject: 'Reminder: follow up on pending balances',
              body: 'You currently have customers with items out and balances still owing. Consider sending a payment reminder from the Notification page.',
              sentAt: hoursAgo(20),
              read: false,
            },
            {
              id: generateId('msg'),
              from: 'Super Admin',
              subject: 'New feature: Excel export',
              body: 'You can now export your Inventory, Stock and Transaction tables straight to Excel from each page.',
              sentAt: hoursAgo(3),
              read: false,
            },
          ],
          seeded: true,
        });
      },

      markRead: (id) => set({ inbox: get().inbox.map((m) => (m.id === id ? { ...m, read: true } : m)) }),
      markAllRead: () => set({ inbox: get().inbox.map((m) => ({ ...m, read: true })) }),
      markManyRead: (ids) => {
        const idSet = new Set(ids);
        set({ inbox: get().inbox.map((m) => (idSet.has(m.id) ? { ...m, read: true } : m)) });
      },
      unreadCount: () => get().inbox.filter((m) => !m.read).length,

      sendPush: (input) => {
        set({
          outbox: [{ ...input, id: generateId('push'), sentAt: new Date().toISOString() }, ...get().outbox],
        });
      },

      logActivity: (subject, body, from) => {
        set({
          inbox: [
            { id: generateId('msg'), from, subject, body, sentAt: new Date().toISOString(), read: false },
            ...get().inbox,
          ],
        });
      },
    }),
    { name: 'gadgetstock-notifications' }
  )
);
