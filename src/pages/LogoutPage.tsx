import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

export default function LogoutPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500 dark:bg-rose-500/10">
          <LogOut size={26} />
        </div>
        <h1 className="text-lg font-bold text-ink">You are about to log out</h1>
        <p className="mt-1.5 text-sm text-ink-soft">Are you sure you want to proceed?</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={() => navigate(-1)}>
            No
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              logout();
              navigate('/login', { replace: true });
            }}
          >
            Yes
          </Button>
        </div>
      </Card>
    </div>
  );
}
