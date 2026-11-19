import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, ChevronDown, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import Avatar from '../ui/Avatar';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { timeAgo } from '../../lib/format';
import { useBasePath } from '../../lib/useBasePath';
import { useMyInbox } from '../../lib/useMyInbox';

export default function Header({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate();
  const base = useBasePath();
  const user = useAuthStore((s) => s.currentUser());
  const inbox = useMyInbox();
  const unreadCount = inbox.filter((m) => !m.read).length;
  const markManyRead = useNotificationStore((s) => s.markManyRead);
  const markAllRead = () => markManyRead(inbox.filter((m) => !m.read).map((m) => m.id));

  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) navigate(`${base}/inventory?q=${encodeURIComponent(search.trim())}`);
  }

  return (
    <header className="flex h-16 items-center gap-3 border-b border-line bg-surface-raised px-4 sm:px-6">
      <button onClick={onOpenMobileNav} className="rounded-lg p-2 text-ink-soft hover:bg-surface lg:hidden">
        <Menu size={20} />
      </button>

      <form onSubmit={submitSearch} className="max-w-md flex-1">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory…"
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-500/20"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <ThemeToggle />

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-ink-soft hover:bg-surface hover:text-ink"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-line bg-surface-raised shadow-popover">
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <p className="text-sm font-semibold text-ink">Notifications</p>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium text-brand-500 hover:underline">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {inbox.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-faint">No notifications yet.</p>}
                {inbox.map((m) => (
                  <div key={m.id} className={`border-b border-line px-4 py-3 last:border-0 ${!m.read ? 'bg-brand-50/60 dark:bg-brand-500/5' : ''}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-ink">{m.subject}</p>
                      {!m.read && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-ink-soft">{m.body}</p>
                    <p className="mt-1 text-[11px] text-ink-faint">{timeAgo(m.sentAt)}</p>
                  </div>
                ))}
              </div>
              <Link
                to={`${base}/notifications`}
                onClick={() => setNotifOpen(false)}
                className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-brand-500 hover:bg-surface"
              >
                View all
              </Link>
            </div>
          )}
        </div>

        <div className="relative pl-1" ref={profileRef}>
          <button onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-surface">
            <Avatar name={user?.name ?? 'Admin'} src={user?.avatar} size={34} />
            <span className="hidden text-left md:block">
              <span className="block text-sm font-semibold leading-tight text-ink">{user?.name}</span>
              <span className="block text-xs capitalize leading-tight text-ink-faint">{user?.role}</span>
            </span>
            <ChevronDown size={15} className="hidden text-ink-faint md:block" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-30 mt-2 w-48 overflow-hidden rounded-xl border border-line bg-surface-raised py-1.5 shadow-popover">
              <Link to={`${base}/settings`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface">
                <User size={15} /> My profile
              </Link>
              <Link to={`${base}/settings`} onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-surface">
                <SettingsIcon size={15} /> Settings
              </Link>
              <Link to="/logout" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">
                <LogOut size={15} /> Log out
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
