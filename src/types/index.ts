export type Condition = 'New' | 'Used';

export type ItemStatus = 'in_stock' | 'out' | 'sold';

export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type TransactionStatus = 'with_customer' | 'returned' | 'completed';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  condition: Condition;
  imei?: string;
  serialNumber: string;
  color: string;
  costPrice: number;
  sellingPrice: number;
  supplier: string;
  status: ItemStatus;
  notes?: string;
  postedBy: string;
  dateAdded: string;
  editedBy?: string;
  editedDate?: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  recordedBy: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  itemCategory: string;
  itemBrand: string;
  itemCondition: Condition;
  itemColor: string;
  customerName: string;
  customerPhone?: string;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: PaymentStatus;
  status: TransactionStatus;
  takenDate: string;
  returnedDate?: string;
  completedDate?: string;
  payments: PaymentRecord[];
  notes?: string;
  staffName: string;
  receiptNo: string;
}

export type UserRole = 'admin' | 'staff';

export interface StaffUser {
  id: string;
  name: string;
  username: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
  position?: string;
  phone?: string;
  avatar?: string;
}

export interface StoreSettings {
  storeName: string;
  logo?: string;
  currencySymbol: string;
  lowStockThreshold: number;
  address: string;
  supportPhone: string;
  supportEmail: string;
  receiptFooter: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  /** Total Sales only counts completed sales after this point, if set. Reset/restored from Settings. */
  salesResetAt?: string;
}

export interface CategoryRecord {
  id: string;
  name: string;
  slug: string;
  createdOn: string;
  active: boolean;
}

export interface BrandRecord {
  id: string;
  category: string;
  name: string;
}

export interface ItemNameRecord {
  id: string;
  category: string;
  brand: string;
  name: string;
  createdOn: string;
}

export interface PushMessage {
  id: string;
  customerName: string;
  customerPhone: string;
  message: string;
  context: 'owing' | 'paid' | 'general';
  sentAt: string;
  sentBy: string;
}

export interface InboxMessage {
  id: string;
  from: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
}
