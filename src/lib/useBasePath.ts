import { useLocation } from 'react-router-dom';

/** The active app section prefix — '/staff' when inside the staff area, '/admin' otherwise. */
export function useBasePath(): '/admin' | '/staff' {
  const location = useLocation();
  return location.pathname.startsWith('/staff') ? '/staff' : '/admin';
}

export function useIsStaffView(): boolean {
  return useBasePath() === '/staff';
}
