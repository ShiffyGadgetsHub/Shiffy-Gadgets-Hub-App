import type { CSSProperties } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, MessageCircleMore, Landmark } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, formatDateTime } from '../lib/format';
import { whatsappLink } from '../lib/whatsapp';
import Button from '../components/ui/Button';
import logoMark from '../assets/logo-mark.png';

// The invoice is a document meant to look the same regardless of the app's theme —
// pin its CSS variables to the light-mode values so it never shifts under dark mode.
const lightScope = {
  colorScheme: 'light',
  '--surface': '#f6f7fb',
  '--surface-soft': '#ffffff',
  '--surface-raised': '#ffffff',
  '--ink': '#171a2b',
  '--ink-soft': '#5b6072',
  '--ink-faint': '#9598a8',
  '--line': '#e7e8f0',
} as CSSProperties;

export default function ReceiptPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const transactions = useInventoryStore((s) => s.transactions);
  const items = useInventoryStore((s) => s.items);
  const settings = useSettingsStore((s) => s.settings);

  const txn = transactions.find((t) => t.id === transactionId);
  const item = txn ? items.find((i) => i.id === txn.itemId) : undefined;

  if (!txn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface" style={lightScope}>
        <p className="text-ink-soft">Invoice not found.</p>
      </div>
    );
  }

  const balance = txn.totalAmount - txn.amountPaid;
  const statusLabel = txn.status === 'completed' ? 'Paid' : txn.paymentStatus === 'partial' ? 'Partially Paid' : 'Unpaid';
  const statusPillClass =
    txn.status === 'completed'
      ? 'bg-emerald-50 text-emerald-700'
      : txn.paymentStatus === 'partial'
      ? 'bg-amber-50 text-amber-700'
      : 'bg-rose-50 text-rose-700';
  const hasBankDetails = settings.bankName && settings.bankAccountNumber && settings.bankAccountName;

  function goBack() {
    if (window.history.length > 1) navigate(-1);
    else window.close();
  }

  function sendWhatsApp() {
    if (!txn || !txn.customerPhone) return;
    const message = `Hi ${txn.customerName}, here is your invoice ${txn.receiptNo} from ${settings.storeName} for ${txn.itemName} — ${
      balance > 0 ? `balance owing: ${formatCurrency(balance, settings.currencySymbol)}` : 'paid in full'
    }. Thank you for your business!`;
    window.open(whatsappLink(txn.customerPhone, message), '_blank');
  }

  return (
    <div className="min-h-screen bg-[#eef1f8] py-10" style={lightScope}>
      <div className="no-print mx-auto mb-5 flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4">
        <Button variant="outline" icon={<ArrowLeft size={15} />} onClick={goBack}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          {txn.customerPhone && (
            <Button variant="outline" icon={<MessageCircleMore size={15} />} onClick={sendWhatsApp}>
              Send on WhatsApp
            </Button>
          )}
          <Button icon={<Printer size={15} />} onClick={() => window.print()}>
            Print / Save PDF
          </Button>
        </div>
      </div>
      {txn.customerPhone && (
        <p className="no-print mx-auto mb-6 max-w-2xl px-4 text-center text-xs text-ink-faint">
          WhatsApp opens a chat with this message pre-filled. To attach this invoice itself, use "Print / Save PDF" first, then attach the saved
          file in the chat — WhatsApp links can't attach files automatically.
        </p>
      )}

      <div className="mx-auto max-w-2xl overflow-hidden rounded-[22px] bg-white shadow-[0_20px_50px_-20px_rgba(10,40,120,0.35)] print:rounded-none print:shadow-none">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-[#0a1a3f] px-8 pb-16 pt-9 text-white">
          <div
            className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rotate-12 bg-white/10"
            style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 70%)' }}
          />
          <div
            className="pointer-events-none absolute -right-6 top-10 h-40 w-40 rotate-12 bg-accent-400/25"
            style={{ clipPath: 'polygon(30% 0%, 100% 0%, 100% 100%, 0% 70%)' }}
          />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-[34px] font-black leading-none tracking-tight">INVOICE</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-white/60">{txn.receiptNo}</p>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 backdrop-blur-sm">
              {settings.logo ? (
                <img src={settings.logo} alt={settings.storeName} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <img src={logoMark} alt="" className="h-9 w-9 object-contain" />
              )}
              <div className="text-right">
                <p className="text-sm font-bold leading-tight">{settings.storeName}</p>
                <p className="text-[10px] leading-tight text-white/60">{settings.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bill To / Total due — overlaps the banner */}
        <div className="relative -mt-8 px-8">
          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-white p-5 shadow-[0_8px_24px_-12px_rgba(10,40,120,0.25)]">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Bill To</p>
              <p className="mt-1.5 text-base font-bold text-ink">{txn.customerName}</p>
              {txn.customerPhone && <p className="text-sm text-ink-soft">{txn.customerPhone}</p>}
              <p className="mt-1.5 text-xs text-ink-faint">{formatDateTime(txn.completedDate ?? txn.takenDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                {balance > 0 ? 'Total Due' : 'Total Paid'}
              </p>
              <p className={`mt-1.5 text-2xl font-black ${balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {formatCurrency(balance > 0 ? balance : txn.totalAmount, settings.currencySymbol)}
              </p>
              <span className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass}`}>{statusLabel}</span>
            </div>
          </div>
        </div>

        <div className="space-y-7 px-8 pb-8 pt-7">
          {/* Items table */}
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#0a1a3f] text-[11px] uppercase tracking-wide text-white">
                  <th className="py-3 pl-4 font-semibold">Description</th>
                  <th className="py-3 font-semibold">Qty</th>
                  <th className="py-3 text-right font-semibold">Price</th>
                  <th className="py-3 pr-4 text-right font-semibold">Total</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-surface/60 align-top">
                  <td className="py-4 pl-4">
                    <p className="font-semibold text-ink">{txn.itemName}</p>
                    <p className="text-xs text-ink-faint">{txn.itemCategory} · {txn.itemCondition} · {txn.itemColor}</p>
                    {item && (
                      <p className="mt-1 font-mono text-[11px] text-ink-faint">
                        S/N: {item.serialNumber}
                        {item.imei && <> · IMEI: {item.imei}</>}
                      </p>
                    )}
                  </td>
                  <td className="py-4 text-ink-soft">1</td>
                  <td className="py-4 text-right text-ink-soft">{formatCurrency(txn.totalAmount, settings.currencySymbol)}</td>
                  <td className="py-4 pr-4 text-right font-semibold text-ink">{formatCurrency(txn.totalAmount, settings.currencySymbol)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment method + totals */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-4">
              {hasBankDetails && (
                <div>
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">
                    <Landmark size={13} /> Payment Method
                  </p>
                  <div className="space-y-1 text-sm">
                    <p className="text-ink-soft">
                      Bank transfer — <span className="font-medium text-ink">{settings.bankName}</span>
                    </p>
                    <p className="text-ink-soft">
                      Acct No. <span className="font-mono font-medium text-ink">{settings.bankAccountNumber}</span>
                    </p>
                    <p className="text-ink-soft">
                      Acct Name <span className="font-medium text-ink">{settings.bankAccountName}</span>
                    </p>
                  </div>
                </div>
              )}
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-ink-faint">Note</p>
                <p className="text-xs text-ink-faint">{settings.receiptFooter}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl bg-surface p-5 text-sm">
              <div className="flex justify-between">
                <span className="text-ink-soft">Sub Total</span>
                <span className="font-medium text-ink">{formatCurrency(txn.totalAmount, settings.currencySymbol)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ink-soft">Amount Paid</span>
                <span className="font-medium text-ink">{formatCurrency(txn.amountPaid, settings.currencySymbol)}</span>
              </div>
              {balance > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Balance</span>
                  <span className="font-semibold">{formatCurrency(balance, settings.currencySymbol)}</span>
                </div>
              )}
              <div className="flex items-center justify-between rounded-lg bg-brand-500 px-3 py-2.5 text-white">
                <span className="text-xs font-bold uppercase tracking-wide">{balance > 0 ? 'Total Due' : 'Total Paid'}</span>
                <span className="text-base font-black">{formatCurrency(balance > 0 ? balance : txn.totalAmount, settings.currencySymbol)}</span>
              </div>
            </div>
          </div>

          {/* Signature */}
          <div className="flex items-end justify-end gap-3 border-t border-dashed border-line pt-6">
            <div className="text-right">
              <p className="font-signature text-3xl leading-none text-ink">{settings.storeName}</p>
              <p className="mt-1 border-t border-line pt-1 text-xs font-medium text-ink-soft">{settings.storeName}</p>
              <p className="text-[11px] italic text-ink-faint">Served by {txn.staffName}</p>
            </div>
          </div>
        </div>

        {/* Footer bar */}
        <div className="bg-[#0a1a3f] px-8 py-4 text-center text-xs text-white/70">
          {settings.supportPhone} · {settings.supportEmail}
        </div>
      </div>
    </div>
  );
}
