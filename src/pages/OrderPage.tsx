import { ShoppingCart } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function OrderPage() {
  return (
    <div>
      <PageHeader title="Order" subtitle="Manage customer orders from one place." />
      <EmptyState icon={ShoppingCart} title="Coming soon" message="Order management is on its way. You'll be able to track customer orders end-to-end right from here." />
    </div>
  );
}
