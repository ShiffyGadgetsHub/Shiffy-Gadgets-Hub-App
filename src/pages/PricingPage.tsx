import { DollarSign } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';

export default function PricingPage() {
  return (
    <div>
      <PageHeader title="Pricing" subtitle="Plans and billing for your Shiffy Gadgets Hub workspace." />
      <EmptyState icon={DollarSign} title="Coming soon" message="Pricing & subscription management will appear here in a future update." />
    </div>
  );
}
