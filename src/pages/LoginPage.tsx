import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LayoutDashboard, PackageSearch, Wallet } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { Input, Label } from '../components/ui/Field';
import Button from '../components/ui/Button';
import logoMark from '../assets/logo-mark.png';

export default function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const currentUser = useAuthStore((s) => s.currentUser());
  const storeName = useSettingsStore((s) => s.settings.storeName);
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (currentUserId) return <Navigate to={currentUser?.role === 'admin' ? '/admin' : '/staff'} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(username, password);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? 'Could not sign in');
      return;
    }
    const loggedInUser = useAuthStore.getState().currentUser();
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
          <h2 className="text-3xl font-bold leading-tight">
            Run your gadget store from one simple dashboard.
          </h2>
          <p className="max-w-sm text-sm text-white/75">
            Track stock, part-payments, pending pickups and sales for every phone, laptop and
            accessory — new or used — in one place.
          </p>
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

          <h1 className="text-2xl font-bold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-sm text-ink-soft">Sign in to manage your store.</p>

          <form onSubmit={onSubmit} className="mt-7 space-y-4">
            <div>
              <Label>Username</Label>
              <Input autoFocus value={username} onChange={(e) => setUsername(e.target.value)} placeholder="admin" />
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

          <p className="mt-6 rounded-lg bg-surface-soft px-3.5 py-2.5 text-center text-xs text-ink-faint">
            Demo credentials — username <strong className="text-ink-soft">admin</strong>, password{' '}
            <strong className="text-ink-soft">admin123</strong>
          </p>
        </div>
      </div>
    </div>
  );
}
