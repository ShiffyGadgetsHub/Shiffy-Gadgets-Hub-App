import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useInventoryStore } from './store/inventoryStore';
import { useCatalogStore } from './store/catalogStore';
import { useNotificationStore } from './store/notificationStore';
import { useUIStore } from './store/uiStore';
import { RequireAuth, RequireAdmin } from './components/RequireAuth';
import AppLayout from './components/layout/AppLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ViewItemPage from './pages/ViewItemPage';
import StockPage from './pages/StockPage';
import CategoryPage from './pages/CategoryPage';
import CatalogManagerPage from './pages/CatalogManagerPage';
import AddStockPage from './pages/AddStockPage';
import OrderPage from './pages/OrderPage';
import TransactionsPage from './pages/TransactionsPage';
import OutstandingPage from './pages/OutstandingPage';
import NotificationPage from './pages/NotificationPage';
import PricingPage from './pages/PricingPage';
import SettingsPage from './pages/SettingsPage';
import LogoutPage from './pages/LogoutPage';
import ReceiptPage from './pages/ReceiptPage';

export default function App() {
  const ensureSeeded = useAuthStore((s) => s.ensureSeeded);
  const seedDemoDataIfEmpty = useInventoryStore((s) => s.seedDemoDataIfEmpty);
  const seedCatalog = useCatalogStore((s) => s.seedIfEmpty);
  const syncLatestCatalog = useCatalogStore((s) => s.syncLatestCatalog);
  const seedNotifications = useNotificationStore((s) => s.seedIfEmpty);
  const theme = useUIStore((s) => s.theme);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    seedCatalog();
    syncLatestCatalog();
    seedNotifications();
    ensureSeeded().then(() => {
      seedDemoDataIfEmpty();
      setReady(true);
    });
  }, [ensureSeeded, seedDemoDataIfEmpty, seedCatalog, syncLatestCatalog, seedNotifications]);

  if (!ready) {
    return <div className="flex h-screen items-center justify-center bg-surface text-ink-soft">Loading…</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/logout"
          element={
            <RequireAuth>
              <LogoutPage />
            </RequireAuth>
          }
        />
        <Route
          path="/receipt/:transactionId"
          element={
            <RequireAuth>
              <ReceiptPage />
            </RequireAuth>
          }
        />

        {/* Admin — full feature set */}
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AppLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/:id" element={<ViewItemPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="category" element={<CategoryPage />} />
          <Route path="category/manage" element={<CatalogManagerPage />} />
          <Route path="add-stock" element={<AddStockPage />} />
          <Route path="order" element={<OrderPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="outstanding" element={<OutstandingPage />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="pricing" element={<PricingPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Staff — restricted feature set, no pricing/revenue visibility */}
        <Route
          path="/staff"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="inventory/:id" element={<ViewItemPage />} />
          <Route path="stock" element={<StockPage />} />
          <Route path="add-stock" element={<AddStockPage />} />
          <Route path="order" element={<OrderPage />} />
          <Route path="outstanding" element={<OutstandingPage />} />
          <Route path="notifications" element={<NotificationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
