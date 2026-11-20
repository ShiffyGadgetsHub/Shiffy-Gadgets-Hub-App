import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutDashboard, PackageSearch, Wallet, ShieldCheck, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { setArea, type Area } from '../lib/area';
import { Input, Label } from '../components/ui/Field';
import Button from '../components/ui/Button';
import logoMark from '../assets/logo-mark.png';

const COPY: Record<Area, { badge: string; icon: typeof ShieldCheck; heading: string; subheading: string; title: string }> = {
  admin: {
    badge: 'Administration Login Access',
    icon: ShieldCheck,
    heading: 'Run your gadget store from one simple dashboard.',
    subheading: 'Full access — inventory, pricing, categories, staff accounts and every sale.',
    title: 'Administration sign in',
  },
  staff: {
    badge: 'Staff Login Access',
    icon: Users,
    heading: 'Track stock, sales and pending pickups.',
    subheading: 'Everything you need for your shift — stock, sales and outstanding balances.',
    title: 'Staff sign in',
  },
};

export default function LoginPage({ area }: { area: Area }) {
  const login = useAuthStore((s) => s.login);
  const logout = useAuthStore((s) => s.logout);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const currentUser = useAuthStore((s) => s.currentUser());
  const storeName = useSettingsStore((s) => s.settings.storeName);
  const navigate = useNavigate();
  const copy = COPY[area];

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setArea(area);
  }, [area]);

  if (currentUserId) return <Navigate to={currentUser?.role === 'admin' ? '/admin' : '/staff'} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    if (!result.ok) {
      setLoading(false);
      setError(result.error ?? 'Could not sign in');
      return;
    }
    const loggedInUser = useAuthStore.getState().currentUser();
    if (area === 'admin' && loggedInUser?.role !== 'admin') {
      await logout();
      setLoading(false);
      setError('This account does not have administrator access. Use the staff login instead.');
      return;
    }
    setLoading(false);
    navigate(loggedInUser?.role === 'admin' ? '/admin' : '/staff', { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <div className="relative hidden w-[46%] flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-ink p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="relative flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 p-1.5">
            <img src={logoMark} alt="" className="h-full w-full object-contain" />
          </div>
          <span className="text-lg font-bold">{storeName}</span>
        </div>

        <div className="relative space-y-7">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-white/90">
            <copy.icon size={13} /> {copy.badge}
          </span>
          <h2 className="text-3xl font-bold leading-tight">{copy.heading}</h2>
          <p className="max-w-sm text-sm text-white/75">{copy.subheading}</p>
          <div className="space-y-4 pt-2">
            {[
              { icon: LayoutDashboard, text: 'Real-time stock & sales analytics' },
              { icon: PackageSearch, text: 'Serial / IMEI level item tracking' },
              { icon: Wallet, text: 'Part-payments & pending balances handled for you' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
                  <Icon size={15} />
                </div>
                <p className="text-sm text-white/85">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-white/50">© {new Date().getFullYear()} {storeName}. All rights reserved.</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center">
              <img src={logoMark} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold text-ink">{storeName}</span>
          </div>

          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink-soft">
            <copy.icon size={13} /> {copy.badge}
          </span>
          <h1 className="text-2xl font-bold text-ink">{copy.title}</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Sign in to manage your store.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                autoFocus
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={area === 'admin' ? 'admin@shiffygadgetshub.com' : 'staff@shiffygadgetshub.com'}
              />
            </div>
            <div>
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-soft"
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600 dark:bg-rose-500/10">{error}</p>}

            <Button type="submit" fullWidth disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
