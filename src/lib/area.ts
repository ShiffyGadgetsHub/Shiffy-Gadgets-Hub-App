const STORAGE_KEY = 'shiffy-area';

export type Area = 'admin' | 'staff';

/**
 * Which "door" this browser TAB is using. Kept in sessionStorage, which
 * (unlike localStorage) is private to a single tab — and is inherited by
 * any tab opened from it via window.open(), e.g. a receipt opened from
 * the Notification page. This is what lets an admin stay signed in in
 * one tab while a staff member is signed in in another tab of the same
 * browser: see supabaseClient.ts, which gives each area its own Supabase
 * session storage key instead of sharing one across every tab.
 */
export function getArea(): Area {
  const stored = sessionStorage.getItem(STORAGE_KEY);
  if (stored === 'admin' || stored === 'staff') return stored;
  const area: Area = window.location.pathname.startsWith('/staff') ? 'staff' : 'admin';
  sessionStorage.setItem(STORAGE_KEY, area);
  return area;
}

export function setArea(area: Area) {
  sessionStorage.setItem(STORAGE_KEY, area);
}

export function loginPathFor(area: Area): string {
  return area === 'staff' ? '/staff/login' : '/admin/login';
}
