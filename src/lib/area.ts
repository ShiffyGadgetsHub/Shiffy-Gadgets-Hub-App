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

/**
 * A not-published-anywhere access key required in the URL to even see the
 * admin/staff login form — this is obscurity (keeps casual visitors, bots
 * and search engines from finding a login page exists at all), not real
 * access control. Anyone who inspects the built JS could still find the
 * expected value; actual account security is still entirely Supabase Auth.
 */
export function getAccessKey(area: Area): string | undefined {
  return area === 'staff' ? import.meta.env.VITE_STAFF_ACCESS_KEY : import.meta.env.VITE_ADMIN_ACCESS_KEY;
}

export function loginPathFor(area: Area): string {
  const base = area === 'staff' ? '/staff/login' : '/admin/login';
  const key = getAccessKey(area);
  return key ? `${base}?key=${encodeURIComponent(key)}` : base;
}
