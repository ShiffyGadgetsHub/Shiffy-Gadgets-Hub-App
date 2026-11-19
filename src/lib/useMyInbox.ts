import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useIsStaffView } from './useBasePath';
import type { InboxMessage } from '../types';

/**
 * Staff only ever see inbox entries logged under their own name — not
 * admin's or other staff's activity. Admin sees everyone else's activity
 * (what staff are doing) but not their own — there's no point notifying
 * yourself of your own actions.
 */
export function useMyInbox(): InboxMessage[] {
  const inbox = useNotificationStore((s) => s.inbox);
  const isStaff = useIsStaffView();
  const user = useAuthStore((s) => s.currentUser());
  return isStaff ? inbox.filter((m) => m.from === user?.name) : inbox.filter((m) => m.from !== user?.name);
}

export function useMyUnreadCount(): number {
  return useMyInbox().filter((m) => !m.read).length;
}
