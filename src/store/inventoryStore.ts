import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from '../lib/id';
import { useToastStore } from './toastStore';
import { useNotificationStore } from './notificationStore';
import { useSettingsStore } from './settingsStore';
import { ordinal } from '../lib/ordinal';
import type { Condition, InventoryItem, PaymentStatus, Transaction } from '../types';

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
  demoSeeded: boolean;

  addStock: (lines: AddStockLine[], postedBy: string) => void;
  updateItem: (id: string, patch: Partial<InventoryItem>, editedBy: string) => void;
  deleteItem: (id: string, deletedBy: string) => void;

  takeOutItem: (input: TakeOutInput) => void;
  addPayment: (transactionId: string, amount: number, recordedBy: string) => void;
  returnItem: (transactionId: string, returnedBy: string) => void;

  seedDemoDataIfEmpty: () => void;
}

export const useInventoryStore = create<InventoryState>()(
  persist(
    (set, get) => ({
      items: [],
      transactions: [],
      demoSeeded: false,

      addStock: (lines, postedBy) => {
        const now = new Date().toISOString();
        const newItems: InventoryItem[] = [];
        for (const line of lines) {
          const count = Math.max(1, line.quantity);
          for (let i = 0; i < count; i++) {
            newItems.push({
              id: generateId('itm'),
              name: line.name.trim(),
              category: line.category,
              brand: line.brand.trim(),
              condition: line.condition,
              serialNumber: (line.serials[i] ?? '').trim().toUpperCase(),
              imei: line.imeis[i]?.trim().toUpperCase() || undefined,
              color: line.colors[i] ?? '',
              costPrice: line.costPrice,
              sellingPrice: line.sellingPrice,
              supplier: line.supplier.trim(),
              status: 'in_stock',
              notes: line.notes?.trim() || undefined,
              postedBy,
              dateAdded: now,
            });
          }
        }
        set({ items: [...newItems, ...get().items] });

        const names = Array.from(new Set(newItems.map((i) => i.name)));
        logActivity(
          'Stock added',
          `${postedBy} added ${newItems.length} unit${newItems.length === 1 ? '' : 's'} of ${names.join(', ')}.`,
          postedBy
        );
      },

      updateItem: (id, patch, editedBy) => {
        const item = get().items.find((i) => i.id === id);
        set({
          items: get().items.map((item) =>
            item.id === id ? { ...item, ...patch, editedBy, editedDate: new Date().toISOString() } : item
          ),
        });
        if (item) logActivity('Item edited', `${editedBy} edited "${item.name}" (S/N ${item.serialNumber}).`, editedBy);
      },

      deleteItem: (id, deletedBy) => {
        const item = get().items.find((i) => i.id === id);
        set({ items: get().items.filter((item) => item.id !== id) });
        if (item) logActivity('Item deleted', `${deletedBy} deleted "${item.name}" (S/N ${item.serialNumber}) from inventory.`, deletedBy);
      },

      takeOutItem: ({ itemId, customerName, customerPhone, totalAmount, amountPaid, staffName, notes }) => {
        const item = get().items.find((i) => i.id === itemId);
        if (!item || item.status !== 'in_stock') return;

        const paymentStatus = computePaymentStatus(totalAmount, amountPaid);
        const now = new Date().toISOString();
        const fullyPaid = paymentStatus === 'paid';
        const receiptNo = `RCT-${String(get().transactions.length + 1).padStart(5, '0')}`;

        const transaction: Transaction = {
          id: generateId('txn'),
          itemId,
          itemName: item.name,
          itemCategory: item.category,
          itemBrand: item.brand,
          itemCondition: item.condition,
          itemColor: item.color,
          customerName: customerName.trim(),
          customerPhone: customerPhone?.trim() || undefined,
          totalAmount,
          amountPaid,
          paymentStatus,
          status: fullyPaid ? 'completed' : 'with_customer',
          takenDate: now,
          completedDate: fullyPaid ? now : undefined,
          payments: amountPaid > 0 ? [{ id: generateId('pay'), amount: amountPaid, date: now, recordedBy: staffName }] : [],
          notes: notes?.trim() || undefined,
          staffName,
          receiptNo,
        };

        set({
          items: get().items.map((i) =>
            i.id === itemId ? { ...i, status: fullyPaid ? 'sold' : 'out' } : i
          ),
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

      addPayment: (transactionId, amount, recordedBy) => {
        const txn = get().transactions.find((t) => t.id === transactionId);
        if (!txn || txn.status !== 'with_customer' || amount <= 0) return;

        const newAmountPaid = txn.amountPaid + amount;
        const paymentStatus = computePaymentStatus(txn.totalAmount, newAmountPaid);
        const fullyPaid = paymentStatus === 'paid';
        const now = new Date().toISOString();

        set({
          transactions: get().transactions.map((t) =>
            t.id === transactionId
              ? {
                  ...t,
                  amountPaid: newAmountPaid,
                  paymentStatus,
                  status: fullyPaid ? 'completed' : t.status,
                  completedDate: fullyPaid ? now : t.completedDate,
                  payments: [...t.payments, { id: generateId('pay'), amount, date: now, recordedBy }],
                }
              : t
          ),
          items: fullyPaid
            ? get().items.map((i) => (i.id === txn.itemId ? { ...i, status: 'sold' } : i))
            : get().items,
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

      returnItem: (transactionId, returnedBy) => {
        const txn = get().transactions.find((t) => t.id === transactionId);
        if (!txn || txn.status !== 'with_customer') return;
        const now = new Date().toISOString();

        set({
          transactions: get().transactions.map((t) =>
            t.id === transactionId ? { ...t, status: 'returned', returnedDate: now } : t
          ),
          items: get().items.map((i) => (i.id === txn.itemId ? { ...i, status: 'in_stock' } : i)),
        });
        logActivity('Item returned', `${returnedBy} marked "${txn.itemName}" as returned by ${txn.customerName}.`, returnedBy);
      },

      seedDemoDataIfEmpty: () => {
        if (get().demoSeeded || get().items.length > 0) return;

        const daysAgo = (n: number, hour = 10) => {
          const d = new Date();
          d.setDate(d.getDate() - n);
          d.setHours(hour, 0, 0, 0);
          return d.toISOString();
        };
        const hoursAgo = (n: number) => new Date(Date.now() - n * 3600 * 1000).toISOString();

        let serialCounter = 10000;
        const nextSerial = (prefix: string) => `${prefix}${serialCounter++}`;

        const makeItem = (
          overrides: Partial<InventoryItem> &
            Pick<InventoryItem, 'name' | 'category' | 'brand' | 'condition' | 'costPrice' | 'sellingPrice' | 'color'>
        ): InventoryItem => ({
          id: generateId('itm'),
          status: 'in_stock',
          dateAdded: daysAgo(20),
          supplier: 'Lagos Mega Supplies',
          serialNumber: nextSerial('SN'),
          postedBy: 'Brother Sheriff',
          ...overrides,
        });

        const items: InventoryItem[] = [
          ...Array.from({ length: 3 }).map(() =>
            makeItem({ name: 'iPhone 15 Pro Max 256GB', category: 'Phones', brand: 'iPhone', condition: 'New', color: 'Natural Titanium', costPrice: 850000, sellingPrice: 980000, imei: nextSerial('IMEI') })
          ),
          ...Array.from({ length: 2 }).map(() =>
            makeItem({ name: 'iPhone 15 Pro Max 256GB', category: 'Phones', brand: 'iPhone', condition: 'Used', color: 'Blue Titanium', costPrice: 600000, sellingPrice: 720000, imei: nextSerial('IMEI') })
          ),
          makeItem({ name: 'iPhone 15 Pro Max 256GB', category: 'Phones', brand: 'iPhone', condition: 'Used', color: 'Blue Titanium', costPrice: 600000, sellingPrice: 720000, imei: nextSerial('IMEI') }),
          ...Array.from({ length: 4 }).map(() =>
            makeItem({ name: 'Galaxy S24 Ultra 512GB', category: 'Phones', brand: 'Samsung', condition: 'New', color: 'Titanium Black', costPrice: 780000, sellingPrice: 900000, imei: nextSerial('IMEI') })
          ),
          ...Array.from({ length: 2 }).map(() =>
            makeItem({ name: 'MacBook Air 13" M3 512GB', category: 'Laptops', brand: 'MacBook', condition: 'New', color: 'Midnight', costPrice: 1100000, sellingPrice: 1300000 })
          ),
          makeItem({ name: 'MacBook Air 13" M3 512GB', category: 'Laptops', brand: 'MacBook', condition: 'New', color: 'Midnight', costPrice: 1100000, sellingPrice: 1300000 }),
          makeItem({ name: 'MacBook Pro 14" M4 1TB', category: 'Laptops', brand: 'MacBook', condition: 'Used', color: 'Space Gray', costPrice: 1400000, sellingPrice: 1650000 }),
          ...Array.from({ length: 3 }).map(() =>
            makeItem({ name: 'PS5 Slim Disc Edition', category: 'PlayStation', brand: 'Sony', condition: 'New', color: 'White', costPrice: 420000, sellingPrice: 520000 })
          ),
          makeItem({ name: 'PS5 Slim Disc Edition', category: 'PlayStation', brand: 'Sony', condition: 'New', color: 'White', costPrice: 420000, sellingPrice: 520000 }),
          ...Array.from({ length: 5 }).map(() =>
            makeItem({ name: 'Apple Watch Series 9', category: 'iWatch', brand: 'Apple', condition: 'New', color: 'Midnight', costPrice: 320000, sellingPrice: 390000 })
          ),
          ...Array.from({ length: 2 }).map(() =>
            makeItem({ name: 'iPad Air 11" M2 256GB', category: 'iPad', brand: 'Apple', condition: 'Used', color: 'Starlight', costPrice: 380000, sellingPrice: 460000 })
          ),
          ...Array.from({ length: 2 }).map(() =>
            makeItem({ name: 'JBL Flip 6', category: 'Audio & Music Equipment', brand: 'JBL', condition: 'New', color: 'Black', costPrice: 55000, sellingPrice: 78000 })
          ),
          ...Array.from({ length: 3 }).map(() =>
            makeItem({ name: 'AirPods Pro 2', category: 'Headphones', brand: 'Apple', condition: 'New', color: 'White', costPrice: 165000, sellingPrice: 210000 })
          ),
        ];

        const pendingUnpaidItem = items[5]; // used iPhone 15 Pro Max
        const partialPaidItem = items[15]; // MacBook Pro 14 used
        const soldItem1 = items[10]; // MacBook Air New
        const soldItem2 = items[9]; // Galaxy S24 Ultra
        const returnedItem = items[20]; // iPad Air used

        pendingUnpaidItem.status = 'out';
        partialPaidItem.status = 'out';
        soldItem1.status = 'sold';
        soldItem2.status = 'sold';

        const transactions: Transaction[] = [
          {
            id: generateId('txn'),
            itemId: pendingUnpaidItem.id,
            itemName: pendingUnpaidItem.name,
            itemCategory: pendingUnpaidItem.category,
            itemBrand: pendingUnpaidItem.brand,
            itemCondition: pendingUnpaidItem.condition,
            itemColor: pendingUnpaidItem.color,
            customerName: 'Tunde Bakare',
            customerPhone: '08031234567',
            totalAmount: pendingUnpaidItem.sellingPrice,
            amountPaid: 0,
            paymentStatus: 'unpaid',
            status: 'with_customer',
            takenDate: hoursAgo(14),
            payments: [],
            staffName: 'Brother Sheriff',
            receiptNo: 'RCT-00001',
          },
          {
            id: generateId('txn'),
            itemId: partialPaidItem.id,
            itemName: partialPaidItem.name,
            itemCategory: partialPaidItem.category,
            itemBrand: partialPaidItem.brand,
            itemCondition: partialPaidItem.condition,
            itemColor: partialPaidItem.color,
            customerName: 'Amaka Obi',
            customerPhone: '08099887766',
            totalAmount: partialPaidItem.sellingPrice,
            amountPaid: 500000,
            paymentStatus: 'partial',
            status: 'with_customer',
            takenDate: hoursAgo(68),
            payments: [{ id: generateId('pay'), amount: 500000, date: hoursAgo(68), recordedBy: 'Brother Sheriff' }],
            staffName: 'Brother Sheriff',
            receiptNo: 'RCT-00002',
          },
          {
            id: generateId('txn'),
            itemId: soldItem1.id,
            itemName: soldItem1.name,
            itemCategory: soldItem1.category,
            itemBrand: soldItem1.brand,
            itemCondition: soldItem1.condition,
            itemColor: soldItem1.color,
            customerName: 'Chidi Eze',
            customerPhone: '08141223344',
            totalAmount: soldItem1.sellingPrice,
            amountPaid: soldItem1.sellingPrice,
            paymentStatus: 'paid',
            status: 'completed',
            takenDate: daysAgo(6),
            completedDate: daysAgo(6),
            payments: [{ id: generateId('pay'), amount: soldItem1.sellingPrice, date: daysAgo(6), recordedBy: 'Brother Sheriff' }],
            staffName: 'Brother Sheriff',
            receiptNo: 'RCT-00003',
          },
          {
            id: generateId('txn'),
            itemId: soldItem2.id,
            itemName: soldItem2.name,
            itemCategory: soldItem2.category,
            itemBrand: soldItem2.brand,
            itemCondition: soldItem2.condition,
            itemColor: soldItem2.color,
            customerName: 'Sophia Johnson',
            customerPhone: '08155667788',
            totalAmount: soldItem2.sellingPrice,
            amountPaid: soldItem2.sellingPrice,
            paymentStatus: 'paid',
            status: 'completed',
            takenDate: daysAgo(1),
            completedDate: daysAgo(1),
            payments: [{ id: generateId('pay'), amount: soldItem2.sellingPrice, date: daysAgo(1), recordedBy: 'Brother Sheriff' }],
            staffName: 'Brother Sheriff',
            receiptNo: 'RCT-00004',
          },
          {
            id: generateId('txn'),
            itemId: returnedItem.id,
            itemName: returnedItem.name,
            itemCategory: returnedItem.category,
            itemBrand: returnedItem.brand,
            itemCondition: returnedItem.condition,
            itemColor: returnedItem.color,
            customerName: 'Ifeoma Nwosu',
            customerPhone: '08177661122',
            totalAmount: returnedItem.sellingPrice,
            amountPaid: 0,
            paymentStatus: 'unpaid',
            status: 'returned',
            takenDate: daysAgo(8),
            returnedDate: daysAgo(7),
            payments: [],
            staffName: 'Brother Sheriff',
            receiptNo: 'RCT-00005',
          },
        ];

        set({ items, transactions, demoSeeded: true });
      },
    }),
    { name: 'gadgetstock-inventory-v2' }
  )
);
