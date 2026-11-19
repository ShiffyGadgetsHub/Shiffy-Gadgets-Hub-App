import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StoreSettings } from '../types';

interface SettingsState {
  settings: StoreSettings;
  updateSettings: (patch: Partial<StoreSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: {
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
      },
      updateSettings: (patch) => set({ settings: { ...get().settings, ...patch } }),
    }),
    {
      name: 'gadgetstock-settings',
      version: 1,
      migrate: (persisted) => {
        const state = persisted as SettingsState;
        if (state?.settings?.storeName === 'GadgetStock') {
          state.settings.storeName = 'Shiffy Gadgets Hub';
          if (state.settings.supportEmail === 'hello@gadgetstock.ng') {
            state.settings.supportEmail = 'hello@shiffygadgetshub.ng';
          }
          if (state.settings.receiptFooter === 'Thank you for shopping with GadgetStock. All sales of used items are final.') {
            state.settings.receiptFooter = 'Thank you for shopping with Shiffy Gadgets Hub. All sales of used items are final.';
          }
        }
        return state;
      },
    }
  )
);
