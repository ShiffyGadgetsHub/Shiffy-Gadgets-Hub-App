import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ArrowLeftRight,
  AlertCircle,
  Tags,
  ShoppingCart,
  Bell,
  DollarSign,
  Settings,
  LogOut,
  ChevronsLeft,
} from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { useBasePath, useIsStaffView } from '../../lib/useBasePath';
import { useMyUnreadCount } from '../../lib/useMyInbox';
import logoMark from '../../assets/logo-mark.png';

const ADMIN_NAV_ITEMS = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'inventory', label: 'Inventory', icon: Package },
  { to: 'stock', label: 'Stock', icon: Layers },
  { to: 'transactions', label: 'Transaction', icon: ArrowLeftRight },
  { to: 'outstanding', label: 'Outstanding', icon: AlertCircle },
  { to: 'category', label: 'Category', icon: Tags },
  { to: 'order', label: 'Order', icon: ShoppingCart },
  { to: 'notifications', label: 'Notification', icon: Bell },
  { to: 'pricing', label: 'Pricing', icon: DollarSign },
  { to: 'settings', label: 'Settings', icon: Settings },
];

const STAFF_NAV_ITEMS = [
  { to: '', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: 'inventory', label: 'Inventory', icon: Package },
  { to: 'stock', label: 'Stock', icon: Layers },
  { to: 'outstanding', label: 'Outstanding', icon: AlertCircle },
  { to: 'order', label: 'Order', icon: ShoppingCart },
  { to: 'notifications', label: 'Notification', icon: Bell },
  { to: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const unreadCount = useMyUnreadCount();
  const storeName = useSettingsStore((s) => s.settings.storeName);
  const outstandingCount = useInventoryStore((s) => s.transactions.filter((t) => t.status === 'with_customer').length);
  const base = useBasePath();
  const isStaff = useIsStaffView();

  const navBadges: Record<string, number> = { Notification: unreadCount, Outstanding: outstandingCount };
  const navItems = isStaff ? STAFF_NAV_ITEMS : ADMIN_NAV_ITEMS;

  return (
    <div className="relative flex h-full flex-col bg-surface-raised">
      <div className={`flex items-center gap-2.5 px-5 py-5 ${collapsed ? 'justify-center px-0' : ''}`}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center">
          <img src={logoMark} alt="" className="h-full w-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-tight text-ink">{storeName}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-ink-faint">
              {isStaff ? 'Staff Panel' : 'Inventory System'}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-[26px] hidden h-6 w-6 items-center justify-center rounded-full border border-line bg-surface-raised text-ink-soft shadow-card hover:text-ink lg:flex"
      >
        <ChevronsLeft size={13} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
      </button>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to ? `${base}/${to}` : base}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                collapsed ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/25'
                  : 'text-ink-soft hover:bg-surface hover:text-ink'
              }`
            }
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && <span className="truncate">{label}</span>}
            {(navBadges[label] ?? 0) > 0 && (
              <span
                className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ${
                  collapsed ? 'absolute right-1 top-1' : 'ml-auto'
                }`}
              >
                {navBadges[label]}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line px-3 py-3">
        <NavLink
          to="/logout"
          onClick={onNavigate}
          title={collapsed ? 'Log out' : undefined}
          className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && <span>Logout</span>}
        </NavLink>
      </div>
    </div>
  );
}
