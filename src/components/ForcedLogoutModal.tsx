import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

/**
 * Shown the moment an already-signed-in staff member's account is
 * deactivated elsewhere (see watchOwnProfile in authStore.ts) — sits
 * outside the auth-gated routes so it stays on screen through the
 * sign-out redirect instead of disappearing with the rest of the page.
 */
export default function ForcedLogoutModal() {
  const reason = useAuthStore((s) => s.forcedLogoutReason);
  const clear = useAuthStore((s) => s.clearForcedLogoutReason);

  if (!reason) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-line bg-surface-raised p-6 text-center shadow-popover">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <ShieldAlert size={24} />
        </div>
        <h2 className="text-base font-semibold text-ink">Signed out</h2>
        <p className="mt-2 text-sm text-ink-soft">{reason}</p>
        <button
          onClick={clear}
          className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          OK
        </button>
      </div>
    </div>
  );
}
