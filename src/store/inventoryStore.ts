import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { useToastStore } from './toastStore';
import { useNotificationStore } from './notificationStore';
import { useSettingsStore } from './settingsStore';
import { ordinal } from '../lib/ordinal';
import type { Condition, InventoryItem, ItemStatus, PaymentRecord, PaymentStatus, Transaction, TransactionStatus } from '../types';

// ─────────────────────────────────────────────────────────────────────────
// DB row <-> app type mapping (DB is snake_case, app types are camelCase)
// ─────────────────────────────────────────────────────────────────────────

interface ItemRow {
  id: string;
  name: string;
  category: string;
  brand: string;
  condition: Condition;
  imei: string | null;
  serial_number: string;
  color: string;
  cost_price: number;
  selling_price: number;
  supplier: string;
  status: ItemStatus;
  notes: string | null;
  posted_by: string;
  date_added: string;
  edited_by: string | null;
  edited_date: string | null;
}

function mapItem(r: ItemRow): InventoryItem {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    brand: r.brand,
    condition: r.condition,
    imei: r.imei ?? undefined,
    serialNumber: r.serial_number,
    color: r.color,
    costPrice: Number(r.cost_price),
    sellingPrice: Number(r.selling_price),
    supplier: r.supplier,
    status: r.status,
    notes: r.notes ?? undefined,
    postedBy: r.posted_by,
    dateAdded: r.date_added,
    editedBy: r.edited_by ?? undefined,
    editedDate: r.edited_date ?? undefined,
  };
}

interface PaymentRow {
  id: string;
  transaction_id: string;
  amount: number;
  date: string;
  recorded_by: string;
}

function mapPayment(r: PaymentRow): PaymentRecord {
  return { id: r.id, amount: Number(r.amount), date: r.date, recordedBy: r.recorded_by };
}

interface TxnRow {
  id: string;
  item_id: string;
  item_name: string;
  item_category: string;
  item_brand: string;
  item_condition: Condition;
  item_color: string;
  customer_name: string;
  customer_phone: string | null;
  total_amount: number;
  amount_paid: number;
  payment_status: PaymentStatus;
  status: TransactionStatus;
  taken_date: string;
  returned_date: string | null;
  completed_date: string | null;
  notes: string | null;
  staff_name: string;
  receipt_no: string;
  payments?: PaymentRow[];
}

function mapTxn(r: TxnRow): Transaction {
  return {
    id: r.id,
    itemId: r.item_id,
    itemName: r.item_name,
    itemCategory: r.item_category,
    itemBrand: r.item_brand,
    itemCondition: r.item_condition,
    itemColor: r.item_color,
    customerName: r.customer_name,
    customerPhone: r.customer_phone ?? undefined,
    totalAmount: Number(r.total_amount),
    amountPaid: Number(r.amount_paid),
    paymentStatus: r.payment_status,
    status: r.status,
    takenDate: r.taken_date,
    returnedDate: r.returned_date ?? undefined,
    completedDate: r.completed_date ?? undefined,
    payments: (r.payments ?? []).map(mapPayment).sort((a, b) => a.date.localeCompare(b.date)),
    notes: r.notes ?? undefined,
    staffName: r.staff_name,
    receiptNo: r.receipt_no,
  };
}

function fmtMoney(amount: number): string {
  const symbol = useSettingsStore.getState().settings.currencySymbol;
  return `${symbol}${amount.toLocaleString()}`;
}

function logActivity(subject: string, body: string, from: string) {
  useNotificationStore.getState().logActivity(subject, body, from);
}

function announceSale(itemName: string, customerName: string, transactions: Transaction[]) {
  const todayKey = new Date().toDateString();
  const salesToday = transactions.filter(
    (t) => t.status === 'completed' && t.completedDate && new Date(t.completedDate).toDateString() === todayKey
  ).length;
  useToastStore.getState().push({
    title: 'Sale completed 🎉',
    message: `${itemName} sold to ${customerName} — the ${ordinal(salesToday)} sale today.`,
  });
}

function announceError(message: string) {
  useToastStore.getState().push({ title: 'Something went wrong', message, tone: 'warning' });
}

export interface AddStockLine {
  category: string;
  brand: string;
  name: string;
  condition: Condition;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  quantity: number;
  serials: string[];
  imeis: string[];
  colors: string[];
  notes?: string;
}

interface TakeOutInput {
  itemId: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  amountPaid: number;
  staffName: string;
  notes?: string;
}

function computePaymentStatus(totalAmount: number, amountPaid: number): PaymentStatus {
  if (amountPaid <= 0) return 'unpaid';
  if (amountPaid >= totalAmount) return 'paid';
  return 'partial';
}

interface InventoryState {
  items: InventoryItem[];
  transactions: Transaction[];
  loaded: boolean;

  loadAll: () => Promise<void>;
  addStock: (lines: AddStockLine[], postedBy: string) => Promise<void>;
  updateItem: (id: string, patch: Partial<InventoryItem>, editedBy: string) => Promise<void>;
  deleteItem: (id: string, deletedBy: string) => Promise<void>;

  takeOutItem: (input: TakeOutInput) => Promise<void>;
  addPayment: (transactionId: string, amount: number, recordedBy: string) => Promise<void>;
  returnItem: (transactionId: string, returnedBy: string) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>()((set, get) => ({
  items: [],
  transactions: [],
  loaded: false,

  loadAll: async () => {
    const [itemsRes, txnsRes] = await Promise.all([
      supabase.from('inventory_items').select('*').order('date_added', { ascending: false }),
      supabase.from('transactions').select('*, payments(*)').order('taken_date', { ascending: false }),
    ]);
    if (itemsRes.error) {
      announceError(itemsRes.error.message);
      return;
    }
    if (txnsRes.error) {
      announceError(txnsRes.error.message);
      return;
    }
    set({
      items: (itemsRes.data as ItemRow[]).map(mapItem),
      transactions: (txnsRes.data as TxnRow[]).map(mapTxn),
      loaded: true,
    });
  },

  addStock: async (lines, postedBy) => {
    const now = new Date().toISOString();
    const rows: Array<Omit<ItemRow, 'id'>> = [];
    for (const line of lines) {
      const count = Math.max(1, line.quantity);
      for (let i = 0; i < count; i++) {
        rows.push({
          name: line.name.trim(),
          category: line.category,
          brand: line.brand.trim(),
          condition: line.condition,
          serial_number: (line.serials[i] ?? '').trim().toUpperCase(),
          imei: line.imeis[i]?.trim().toUpperCase() || null,
          color: line.colors[i] ?? '',
          cost_price: line.costPrice,
          selling_price: line.sellingPrice,
          supplier: line.supplier.trim(),
          status: 'in_stock',
          notes: line.notes?.trim() || null,
          posted_by: postedBy,
          date_added: now,
          edited_by: null,
          edited_date: null,
        });
      }
    }

    const { data, error } = await supabase.from('inventory_items').insert(rows).select();
    if (error || !data) {
      announceError(error?.message ?? 'Could not add stock');
      return;
    }

    const newItems = (data as ItemRow[]).map(mapItem);
    set({ items: [...newItems, ...get().items] });

    const names = Array.from(new Set(newItems.map((i) => i.name)));
    logActivity(
      'Stock added',
      `${postedBy} added ${newItems.length} unit${newItems.length === 1 ? '' : 's'} of ${names.join(', ')}.`,
      postedBy
    );
  },

  updateItem: async (id, patch, editedBy) => {
    const item = get().items.find((i) => i.id === id);
    const editedDate = new Date().toISOString();

    const dbPatch: Record<string, unknown> = { edited_by: editedBy, edited_date: editedDate };
    if (patch.name !== undefined) dbPatch.name = patch.name;
    if (patch.category !== undefined) dbPatch.category = patch.category;
    if (patch.brand !== undefined) dbPatch.brand = patch.brand;
    if (patch.condition !== undefined) dbPatch.condition = patch.condition;
    if (patch.imei !== undefined) dbPatch.imei = patch.imei || null;
    if (patch.serialNumber !== undefined) dbPatch.serial_number = patch.serialNumber;
    if (patch.color !== undefined) dbPatch.color = patch.color;
    if (patch.costPrice !== undefined) dbPatch.cost_price = patch.costPrice;
    if (patch.sellingPrice !== undefined) dbPatch.selling_price = patch.sellingPrice;
    if (patch.supplier !== undefined) dbPatch.supplier = patch.supplier;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    if (patch.notes !== undefined) dbPatch.notes = patch.notes || null;

    const { error } = await supabase.from('inventory_items').update(dbPatch).eq('id', id);
    if (error) {
      announceError(error.message);
      return;
    }

    set({
      items: get().items.map((i) => (i.id === id ? { ...i, ...patch, editedBy, editedDate } : i)),
    });
    if (item) logActivity('Item edited', `${editedBy} edited "${item.name}" (S/N ${item.serialNumber}).`, editedBy);
  },

  deleteItem: async (id, deletedBy) => {
    const item = get().items.find((i) => i.id === id);
    const { error } = await supabase.from('inventory_items').delete().eq('id', id);
    if (error) {
      announceError(error.message);
      return;
    }
    set({ items: get().items.filter((i) => i.id !== id) });
    if (item) logActivity('Item deleted', `${deletedBy} deleted "${item.name}" (S/N ${item.serialNumber}) from inventory.`, deletedBy);
  },

  takeOutItem: async ({ itemId, customerName, customerPhone, totalAmount, amountPaid, staffName, notes }) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item || item.status !== 'in_stock') return;

    const paymentStatus = computePaymentStatus(totalAmount, amountPaid);
    const now = new Date().toISOString();
    const fullyPaid = paymentStatus === 'paid';
    const receiptNo = `RCT-${String(get().transactions.length + 1).padStart(5, '0')}`;

    const { data: txnData, error: txnErr } = await supabase
      .from('transactions')
      .insert({
        item_id: itemId,
        item_name: item.name,
        item_category: item.category,
        item_brand: item.brand,
        item_condition: item.condition,
        item_color: item.color,
        customer_name: customerName.trim(),
        customer_phone: customerPhone?.trim() || null,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        payment_status: paymentStatus,
        status: fullyPaid ? 'completed' : 'with_customer',
        taken_date: now,
        completed_date: fullyPaid ? now : null,
        notes: notes?.trim() || null,
        staff_name: staffName,
        receipt_no: receiptNo,
      })
      .select()
      .single();
    if (txnErr || !txnData) {
      announceError(txnErr?.message ?? 'Could not record transaction');
      return;
    }

    let payments: PaymentRecord[] = [];
    if (amountPaid > 0) {
      const { data: payData, error: payErr } = await supabase
        .from('payments')
        .insert({ transaction_id: txnData.id, amount: amountPaid, date: now, recorded_by: staffName })
        .select()
        .single();
      if (!payErr && payData) payments = [mapPayment(payData as PaymentRow)];
    }

    const { error: itemErr } = await supabase
      .from('inventory_items')
      .update({ status: fullyPaid ? 'sold' : 'out' })
      .eq('id', itemId);
    if (itemErr) announceError(itemErr.message);

    const transaction: Transaction = { ...mapTxn(txnData as TxnRow), payments };
    set({
      items: get().items.map((i) => (i.id === itemId ? { ...i, status: fullyPaid ? 'sold' : 'out' } : i)),
      transactions: [transaction, ...get().transactions],
    });

    logActivity(
      fullyPaid ? 'Sale recorded' : 'Item released',
      `${staffName} ${fullyPaid ? 'sold' : 'released'} "${item.name}" to ${transaction.customerName}${
        fullyPaid ? ' (paid in full).' : ` — ${fmtMoney(totalAmount - amountPaid)} still owing.`
      }`,
      staffName
    );
    if (fullyPaid) announceSale(item.name, transaction.customerName, get().transactions);
  },

  addPayment: async (transactionId, amount, recordedBy) => {
    const txn = get().transactions.find((t) => t.id === transactionId);
    if (!txn || txn.status !== 'with_customer' || amount <= 0) return;

    const newAmountPaid = txn.amountPaid + amount;
    const paymentStatus = computePaymentStatus(txn.totalAmount, newAmountPaid);
    const fullyPaid = paymentStatus === 'paid';
    const now = new Date().toISOString();

    const { data: payData, error: payErr } = await supabase
      .from('payments')
      .insert({ transaction_id: transactionId, amount, date: now, recorded_by: recordedBy })
      .select()
      .single();
    if (payErr || !payData) {
      announceError(payErr?.message ?? 'Could not record payment');
      return;
    }

    const { error: txnErr } = await supabase
      .from('transactions')
      .update({
        amount_paid: newAmountPaid,
        payment_status: paymentStatus,
        status: fullyPaid ? 'completed' : txn.status,
        completed_date: fullyPaid ? now : txn.completedDate ?? null,
      })
      .eq('id', transactionId);
    if (txnErr) {
      announceError(txnErr.message);
      return;
    }

    if (fullyPaid) {
      const { error: itemErr } = await supabase.from('inventory_items').update({ status: 'sold' }).eq('id', txn.itemId);
      if (itemErr) announceError(itemErr.message);
    }

    const newPayment = mapPayment(payData as PaymentRow);
    set({
      transactions: get().transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              amountPaid: newAmountPaid,
              paymentStatus,
              status: fullyPaid ? 'completed' : t.status,
              completedDate: fullyPaid ? now : t.completedDate,
              payments: [...t.payments, newPayment],
            }
          : t
      ),
      items: fullyPaid ? get().items.map((i) => (i.id === txn.itemId ? { ...i, status: 'sold' } : i)) : get().items,
    });

    logActivity(
      'Payment recorded',
      `${recordedBy} recorded ${fmtMoney(amount)} from ${txn.customerName} for "${txn.itemName}"${
        fullyPaid ? ' — balance now fully paid.' : ` — ${fmtMoney(txn.totalAmount - newAmountPaid)} still owing.`
      }`,
      recordedBy
    );
    if (fullyPaid) announceSale(txn.itemName, txn.customerName, get().transactions);
  },

  returnItem: async (transactionId, returnedBy) => {
    const txn = get().transactions.find((t) => t.id === transactionId);
    if (!txn || txn.status !== 'with_customer') return;
    const now = new Date().toISOString();

    const { error: txnErr } = await supabase
      .from('transactions')
      .update({ status: 'returned', returned_date: now })
      .eq('id', transactionId);
    if (txnErr) {
      announceError(txnErr.message);
      return;
    }
    const { error: itemErr } = await supabase.from('inventory_items').update({ status: 'in_stock' }).eq('id', txn.itemId);
    if (itemErr) {
      announceError(itemErr.message);
      return;
    }

    set({
      transactions: get().transactions.map((t) => (t.id === transactionId ? { ...t, status: 'returned', returnedDate: now } : t)),
      items: get().items.map((i) => (i.id === txn.itemId ? { ...i, status: 'in_stock' } : i)),
    });
    logActivity('Item returned', `${returnedBy} marked "${txn.itemName}" as returned by ${txn.customerName}.`, returnedBy);
  },
}));
