import { useEffect, useMemo, useState } from 'react';
import { Send, Inbox, MessageCircleMore, CheckCheck, Search, Users, FileText } from 'lucide-react';
import { useInventoryStore } from '../store/inventoryStore';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';
import { useSettingsStore } from '../store/settingsStore';
import { formatCurrency, timeAgo } from '../lib/format';
import { whatsappLink } from '../lib/whatsapp';
import PageHeader from '../components/ui/PageHeader';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { FieldWrap, Textarea } from '../components/ui/Field';
import EmptyState from '../components/ui/EmptyState';
import { useMyInbox } from '../lib/useMyInbox';
import { useIsStaffView } from '../lib/useBasePath';
import type { Transaction } from '../types';

type PageTab = 'send' | 'inbox';
type GroupFilter = 'all' | 'owing' | 'paid';

interface Contact {
  name: string;
  phone: string;
  balance: number;
  group: 'owing' | 'paid';
  transactionId: string;
}

function buildContacts(transactions: Transaction[]): Contact[] {
  const map = new Map<string, Contact>();

  for (const t of transactions) {
    if (!t.customerPhone || t.status !== 'with_customer') continue;
    const balance = t.totalAmount - t.amountPaid;
    if (balance <= 0) continue;
    const existing = map.get(t.customerPhone);
    if (!existing || balance > existing.balance) {
      map.set(t.customerPhone, { name: t.customerName, phone: t.customerPhone, balance, group: 'owing', transactionId: t.id });
    }
  }

  for (const t of transactions) {
    if (!t.customerPhone || t.status !== 'completed' || map.has(t.customerPhone)) continue;
    map.set(t.customerPhone, { name: t.customerName, phone: t.customerPhone, balance: 0, group: 'paid', transactionId: t.id });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function defaultTemplate(group: 'owing' | 'paid'): string {
  return group === 'paid'
    ? 'Hi {name}, thank you for your purchase and for paying in full. We appreciate your business!'
    : 'Hi {name}, this is a friendly reminder that you have an outstanding balance of {balance} on your item. Kindly complete payment at your earliest convenience. Thank you!';
}

function renderTemplate(template: string, contact: Contact, currencySymbol: string): string {
  return template.replaceAll('{name}', contact.name).replaceAll('{balance}', formatCurrency(contact.balance, currencySymbol));
}

const GROUP_LABEL: Record<GroupFilter, string> = { all: 'All customers', owing: 'Owing', paid: 'Paid in full' };

export default function NotificationPage() {
  const transactions = useInventoryStore((s) => s.transactions);
  const outbox = useNotificationStore((s) => s.outbox);
  const inbox = useMyInbox();
  const isStaff = useIsStaffView();
  const sendPush = useNotificationStore((s) => s.sendPush);
  const markRead = useNotificationStore((s) => s.markRead);
  const markManyRead = useNotificationStore((s) => s.markManyRead);
  const markAllRead = () => markManyRead(inbox.filter((m) => !m.read).map((m) => m.id));
  const user = useAuthStore((s) => s.currentUser());
  const currencySymbol = useSettingsStore((s) => s.settings.currencySymbol);

  const [tab, setTab] = useState<PageTab>('send');
  const [groupFilter, setGroupFilter] = useState<GroupFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedPhone, setSelectedPhone] = useState('');
  const [template, setTemplate] = useState(defaultTemplate('owing'));
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const contacts = useMemo(() => buildContacts(transactions), [transactions]);
  const owingCount = contacts.filter((c) => c.group === 'owing').length;
  const paidCount = contacts.filter((c) => c.group === 'paid').length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (groupFilter !== 'all' && c.group !== groupFilter) return false;
      if (q && !c.name.toLowerCase().includes(q) && !c.phone.includes(q)) return false;
      return true;
    });
  }, [contacts, groupFilter, search]);

  useEffect(() => {
    if (!filtered.some((c) => c.phone === selectedPhone)) {
      const first = filtered[0];
      setSelectedPhone(first?.phone ?? '');
      if (first) setTemplate(defaultTemplate(first.group));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered]);

  const selected = contacts.find((c) => c.phone === selectedPhone);

  function selectContact(c: Contact) {
    setSelectedPhone(c.phone);
    setTemplate(defaultTemplate(c.group));
  }

  function handleSend() {
    if (!selected) return;
    const message = renderTemplate(template, selected, currencySymbol);
    sendPush({ customerName: selected.name, customerPhone: selected.phone, message, context: selected.group, sentBy: user?.name ?? 'Staff' });
    window.open(whatsappLink(selected.phone, message), '_blank');
  }

  function handleSendToAll() {
    const staff = user?.name ?? 'Staff';
    for (const c of filtered) {
      const message = renderTemplate(template, c, currencySymbol);
      sendPush({ customerName: c.name, customerPhone: c.phone, message, context: c.group, sentBy: staff });
      window.open(whatsappLink(c.phone, message), '_blank');
    }
    setBulkConfirmOpen(false);
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Notification" subtitle="Message customers on WhatsApp, and catch updates from Super Admin." />

      <div className="flex gap-2 border-b border-line">
        <button onClick={() => setTab('send')} className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === 'send' ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-soft hover:text-ink'}`}>
          <Send size={15} /> Push Notification
        </button>
        <button onClick={() => setTab('inbox')} className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium ${tab === 'inbox' ? 'border-brand-500 text-brand-500' : 'border-transparent text-ink-soft hover:text-ink'}`}>
          <Inbox size={15} /> Inbox
          {inbox.some((m) => !m.read) && <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />}
        </button>
      </div>

      {tab === 'send' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <h2 className="mb-1 text-sm font-semibold text-ink">Send to customers</h2>
            <p className="mb-4 text-xs text-ink-faint">Group by payment status, or search for someone by name.</p>

            <div className="mb-3 flex flex-wrap gap-1.5">
              {(['all', 'owing', 'paid'] as GroupFilter[]).map((g) => (
                <button
                  key={g}
                  onClick={() => {
                    setGroupFilter(g);
                    setSearch('');
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    groupFilter === g ? 'border-brand-500 bg-brand-500 text-white' : 'border-line text-ink-soft hover:bg-surface'
                  }`}
                >
                  {g === 'all' ? `All (${contacts.length})` : g === 'owing' ? `Owing (${owingCount})` : `Paid (${paidCount})`}
                </button>
              ))}
            </div>

            {contacts.length === 0 ? (
              <p className="text-sm text-ink-faint">No customers with a saved phone number yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search customer by name or phone…"
                    className="h-10 w-full rounded-lg border border-line bg-surface-soft pl-9 pr-3 text-sm text-ink outline-none focus:border-brand-400"
                  />
                </div>

                <div className="max-h-48 divide-y divide-line overflow-y-auto rounded-lg border border-line">
                  {filtered.length === 0 && <p className="px-3 py-6 text-center text-sm text-ink-faint">No matching customers.</p>}
                  {filtered.map((c) => (
                    <button
                      key={c.phone}
                      onClick={() => selectContact(c)}
                      className={`flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-surface ${
                        selectedPhone === c.phone ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                      }`}
                    >
                      <span className="min-w-0 truncate">
                        <span className="font-medium text-ink">{c.name}</span>{' '}
                        <span className="text-ink-faint">— {c.phone}</span>
                      </span>
                      <Badge tone={c.group === 'owing' ? 'red' : 'green'}>{c.group === 'owing' ? formatCurrency(c.balance, currencySymbol) : 'Paid'}</Badge>
                    </button>
                  ))}
                </div>

                <FieldWrap label="Message" hint="Use {name} and {balance} — they're filled in per customer.">
                  <Textarea rows={5} value={template} onChange={(e) => setTemplate(e.target.value)} />
                </FieldWrap>

                {selected && (
                  <div className="rounded-lg bg-surface px-3.5 py-2.5 text-xs text-ink-soft">
                    <span className="font-medium text-ink-faint">Preview for {selected.name}: </span>
                    {renderTemplate(template, selected, currencySymbol)}
                  </div>
                )}

                {selected?.group === 'owing' && (
                  <Button
                    fullWidth
                    variant="outline"
                    icon={<FileText size={16} />}
                    onClick={() => window.open(`/receipt/${selected.transactionId}`, '_blank')}
                  >
                    Open unpaid invoice to attach
                  </Button>
                )}

                <Button fullWidth icon={<MessageCircleMore size={16} />} onClick={handleSend} disabled={!selected}>
                  Send on WhatsApp
                </Button>

                {selected?.group === 'owing' && (
                  <p className="text-center text-[11px] text-ink-faint">
                    WhatsApp links can't attach files automatically — open the invoice above, use "Print / Save PDF", then attach it in the
                    chat that opens.
                  </p>
                )}

                {groupFilter !== 'all' && filtered.length > 1 && (
                  <>
                    <Button fullWidth variant="outline" icon={<Users size={16} />} onClick={() => setBulkConfirmOpen(true)}>
                      Send to all {GROUP_LABEL[groupFilter].toLowerCase()} ({filtered.length})
                    </Button>
                    <p className="text-center text-[11px] text-ink-faint">
                      Opens one WhatsApp tab per customer — your browser may ask you to allow pop-ups for this site.
                    </p>
                  </>
                )}
              </div>
            )}
          </Card>

          <Card className="lg:col-span-3" padded={false}>
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Sent history</h2>
            </div>
            <div className="max-h-[480px] divide-y divide-line overflow-y-auto">
              {outbox.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-faint">No messages sent yet.</p>}
              {outbox.map((m) => (
                <div key={m.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-ink">{m.customerName}</p>
                    <div className="flex items-center gap-2">
                      <Badge tone={m.context === 'owing' ? 'red' : 'green'}>{m.context === 'owing' ? 'Owing' : 'Paid'}</Badge>
                      <p className="shrink-0 text-xs text-ink-faint">{timeAgo(m.sentAt)}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">{m.message}</p>
                  <p className="mt-1 text-xs text-ink-faint">by {m.sentBy}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'inbox' && (
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-ink">{isStaff ? 'Your activity' : 'Messages from Super Admin'}</h2>
            <button onClick={markAllRead} className="flex items-center gap-1.5 text-xs font-medium text-brand-500 hover:underline">
              <CheckCheck size={14} /> Mark all read
            </button>
          </div>
          {inbox.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={Inbox}
                title="Nothing here yet"
                message={isStaff ? "Your sales and returns will show up here as you process them." : 'Updates from Super Admin will show up in this inbox.'}
              />
            </div>
          ) : (
            <div className="divide-y divide-line">
              {inbox.map((m) => (
                <button
                  key={m.id}
                  onClick={() => markRead(m.id)}
                  className={`flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-surface/60 ${!m.read ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''}`}
                >
                  {!m.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  <div className={!m.read ? '' : 'pl-5'}>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-ink">{m.subject}</p>
                      <span className="text-xs text-ink-faint">· {m.from}</span>
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">{m.body}</p>
                    <p className="mt-1 text-xs text-ink-faint">{timeAgo(m.sentAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      <ConfirmDialog
        open={bulkConfirmOpen}
        title="Send bulk message"
        message={`Send this message to all ${filtered.length} ${GROUP_LABEL[groupFilter].toLowerCase()} customers now? A WhatsApp tab will open for each one.`}
        confirmLabel="Yes, send"
        cancelLabel="Cancel"
        onCancel={() => setBulkConfirmOpen(false)}
        onConfirm={handleSendToAll}
      />
    </div>
  );
}
