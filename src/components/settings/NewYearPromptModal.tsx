import { useMemo, useState } from 'react';
import { Download, RotateCcw, Clock } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useInventoryStore } from '../../store/inventoryStore';
import { computeYearStats } from '../../lib/yearStats';
import { downloadYearEndReport } from '../../lib/yearEndReport';
import { formatCurrency } from '../../lib/format';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Shown once per new year to an admin who has prior-year sales sitting in
 * the Dashboard's Total Sales figure — nudges them to archive last year's
 * numbers (download) and/or reset the counter for the new year. Fully
 * self-contained: renders nothing until the conditions are met.
 */
export default function NewYearPromptModal() {
  const settings = useSettingsStore((s) => s.settings);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const resetTotalSales = useSettingsStore((s) => s.resetTotalSales);
  const dismissYearPrompt = useSettingsStore((s) => s.dismissYearPrompt);
  const items = useInventoryStore((s) => s.items);
  const transactions = useInventoryStore((s) => s.transactions);
  const [dismissedLocally, setDismissedLocally] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const hasPriorYearSales = useMemo(
    () =>
      transactions.some(
        (t) => t.status === 'completed' && t.completedDate && new Date(t.completedDate).getFullYear() < currentYear
      ),
    [transactions, currentYear]
  );

  const lastResetYear = settings.salesResetAt ? new Date(settings.salesResetAt).getFullYear() : null;
  const alreadyHandled = lastResetYear === currentYear || settings.yearPromptDismissedYear === currentYear;
  const shouldShow = settingsLoaded && hasPriorYearSales && !alreadyHandled && !dismissedLocally;

  const lastYearStats = useMemo(() => computeYearStats(items, transactions, lastYear), [items, transactions, lastYear]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadYearEndReport(lastYear, items, transactions, settings.storeName, settings.currencySymbol);
    } finally {
      setDownloading(false);
    }
  }

  function handleRemindLater() {
    dismissYearPrompt(currentYear);
    setDismissedLocally(true);
  }

  function handleReset() {
    resetTotalSales();
    setDismissedLocally(true);
  }

  return (
    <Modal
      open={shouldShow}
      onClose={handleRemindLater}
      title={`Happy New Year — it's ${currentYear} 🎉`}
      footer={
        <>
          <Button variant="outline" icon={<Clock size={14} />} onClick={handleRemindLater}>
            Remind Me Later
          </Button>
          <Button variant="outline" icon={<Download size={14} />} onClick={handleDownload} disabled={downloading}>
            {downloading ? 'Generating…' : `Download ${lastYear} Report`}
          </Button>
          <Button icon={<RotateCcw size={14} />} onClick={handleReset}>
            Reset Total Sales for {currentYear}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-ink-soft">
        <p>
          In <strong className="text-ink">{lastYear}</strong>, {settings.storeName} made{' '}
          <strong className="text-ink">{formatCurrency(lastYearStats.revenue, settings.currencySymbol)}</strong> across{' '}
          <strong className="text-ink">{lastYearStats.unitsSold}</strong> sale{lastYearStats.unitsSold === 1 ? '' : 's'}, with{' '}
          {formatCurrency(lastYearStats.profit, settings.currencySymbol)} in profit.
        </p>
        <p>
          The Dashboard's Total Sales figure still includes all of that. You can download {lastYear}'s full report to keep for
          your records, then reset Total Sales to start {currentYear} fresh — or just remind yourself later.
        </p>
        <p className="text-xs text-ink-faint">
          Resetting only changes what the Dashboard counts from — every past sale stays on record and can be restored any time
          from Settings.
        </p>
      </div>
    </Modal>
  );
}
