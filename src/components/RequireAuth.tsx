import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function RequireAuth({ children }: { children: ReactNode }) {
  const currentUserId = useAuthStore((s) => s.currentUserId);
  if (!currentUserId) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RequireAdmin({ children }: { children: ReactNode }) {
  const currentUserId = useAuthStore((s) => s.currentUserId);
  const role = useAuthStore((s) => s.currentUser()?.role);
  if (!currentUserId) return <Navigate to="/login" replace />;
  if (role !== 'admin') return <Navigate to="/staff" replace />;
  return <>{children}</>;
}
