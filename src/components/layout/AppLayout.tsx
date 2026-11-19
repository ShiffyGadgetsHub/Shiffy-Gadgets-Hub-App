import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ToastContainer from '../ui/ToastContainer';
import { useUIStore } from '../../store/uiStore';

export default function AppLayout() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <ToastContainer />
      <aside
        className={`hidden shrink-0 border-r border-line transition-all duration-200 lg:block ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line shadow-popover">
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenMobileNav={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
