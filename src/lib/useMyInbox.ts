import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useIsStaffView } from './useBasePath';
import type { InboxMessage } from '../types';

/** Staff only ever see inbox entries logged under their own name — not admin's or other staff's activity. */
export function useMyInbox(): InboxMessage[] {
  const inbox = useNotificationStore((s) => s.inbox);
  const isStaff = useIsStaffView();
  const user = useAuthStore((s) => s.currentUser());
  return isStaff ? inbox.filter((m) => m.from === user?.name) : inbox;
}

export function useMyUnreadCount(): number {
  return useMyInbox().filter((m) => !m.read).length;
}
