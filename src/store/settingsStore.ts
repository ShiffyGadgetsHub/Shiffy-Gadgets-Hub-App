import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import type { StoreSettings } from '../types';

interface SettingsRow {
  store_name: string;
  logo: string | null;
  currency_symbol: string;
  low_stock_threshold: number;
  address: string;
  support_phone: string;
  support_email: string;
  receipt_footer: string;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  sales_reset_at: string | null;
  year_prompt_dismissed_year: number | null;
}

function mapSettings(r: SettingsRow): StoreSettings {
  return {
    storeName: r.store_name,
    logo: r.logo ?? undefined,
    currencySymbol: r.currency_symbol,
    lowStockThreshold: r.low_stock_threshold,
    address: r.address,
    supportPhone: r.support_phone,
    supportEmail: r.support_email,
    receiptFooter: r.receipt_footer,
    bankName: r.bank_name ?? undefined,
    bankAccountNumber: r.bank_account_number ?? undefined,
    bankAccountName: r.bank_account_name ?? undefined,
    salesResetAt: r.sales_reset_at ?? undefined,
    yearPromptDismissedYear: r.year_prompt_dismissed_year ?? undefined,
  };
}

const DEFAULT_SETTINGS: StoreSettings = {
  storeName: 'Shiffy Gadgets Hub',
  currencySymbol: '₦',
  lowStockThreshold: 3,
  address: 'Shop 14, Otigba Street, Computer Village, Ikeja, Lagos',
  supportPhone: '08012345678',
  supportEmail: 'hello@shiffygadgetshub.ng',
  receiptFooter: 'Thank you for shopping with Shiffy Gadgets Hub. All sales of used items are final.',
  bankName: '',
  bankAccountNumber: '',
  bankAccountName: '',
};

interface SettingsState {
  settings: StoreSettings;
  loaded: boolean;
  loadSettings: () => Promise<void>;
  updateSettings: (patch: Partial<StoreSettings>) => Promise<void>;
  resetTotalSales: () => Promise<void>;
  restoreTotalSales: () => Promise<void>;
  dismissYearPrompt: (year: number) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  loadSettings: async () => {
    const { data, error } = await supabase.from('store_settings').select('*').eq('id', true).maybeSingle();
    if (error || !data) return;
    set({ settings: mapSettings(data as SettingsRow), loaded: true });
  },

  updateSettings: async (patch) => {
    const dbPatch: Record<string, unknown> = {};
    if (patch.storeName !== undefined) dbPatch.store_name = patch.storeName;
    if (patch.logo !== undefined) dbPatch.logo = patch.logo || null;
    if (patch.currencySymbol !== undefined) dbPatch.currency_symbol = patch.currencySymbol;
    if (patch.lowStockThreshold !== undefined) dbPatch.low_stock_threshold = patch.lowStockThreshold;
    if (patch.address !== undefined) dbPatch.address = patch.address;
    if (patch.supportPhone !== undefined) dbPatch.support_phone = patch.supportPhone;
    if (patch.supportEmail !== undefined) dbPatch.support_email = patch.supportEmail;
    if (patch.receiptFooter !== undefined) dbPatch.receipt_footer = patch.receiptFooter;
    if (patch.bankName !== undefined) dbPatch.bank_name = patch.bankName || null;
    if (patch.bankAccountNumber !== undefined) dbPatch.bank_account_number = patch.bankAccountNumber || null;
    if (patch.bankAccountName !== undefined) dbPatch.bank_account_name = patch.bankAccountName || null;
    if (patch.salesResetAt !== undefined) dbPatch.sales_reset_at = patch.salesResetAt || null;

    const { error } = await supabase.from('store_settings').update(dbPatch).eq('id', true);
    if (error) return;
    set({ settings: { ...get().settings, ...patch } });
  },

  resetTotalSales: async () => {
    await get().updateSettings({ salesResetAt: new Date().toISOString() });
  },

  restoreTotalSales: async () => {
    // updateSettings treats `undefined` fields as "leave untouched", so clearing
    // needs a direct call rather than going through the generic patch helper.
    const { error } = await supabase.from('store_settings').update({ sales_reset_at: null }).eq('id', true);
    if (error) return;
    set({ settings: { ...get().settings, salesResetAt: undefined } });
  },

  dismissYearPrompt: async (year) => {
    const { error } = await supabase.from('store_settings').update({ year_prompt_dismissed_year: year }).eq('id', true);
    if (error) return;
    set({ settings: { ...get().settings, yearPromptDismissedYear: year } });
  },
}));
