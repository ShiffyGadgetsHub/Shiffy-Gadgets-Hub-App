import { createClient } from '@supabase/supabase-js';
import { getArea } from './area';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill in your Supabase project values.'
  );
}

// Admin and staff each get their own session storage key. By default
// Supabase keeps one session synced across every tab of the same
// browser (sign in on one tab and every other tab picks it up) — fine
// for one person switching tabs, but it means an admin and a staff
// member can't be signed in at the same time on the same browser. Since
// the storage key is fixed per page load, and getArea() is decided once
// per tab (see lib/area.ts), each tab keeps its own independent session.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { storageKey: `sb-shiffy-${getArea()}-auth` },
});
