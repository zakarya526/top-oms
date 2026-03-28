import { create } from 'zustand';

import { Tables } from '@/lib/types/database';

type MenuItem = Tables<'menu_items'>;

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

interface OrderStore {
  tableId: string | null;
  items: CartItem[];
  orderNotes: string;

  setTable: (tableId: string) => void;
  addItem: (menuItem: MenuItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  updateItemNotes: (menuItemId: string, notes: string) => void;
  setOrderNotes: (notes: string) => void;
  getTotal: () => number;
  getItemCount: () => number;
  clearCart: () => void;
}

export const useOrderStore = create<OrderStore>((set, get) => ({
  tableId: null,
  items: [],
  orderNotes: '',

  setTable: (tableId) => set({ tableId }),

  addItem: (menuItem) =>
    set((state) => {
      const existing = state.items.find((i) => i.menuItem.id === menuItem.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.menuItem.id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i
          ),
        };
      }
      return { items: [...state.items, { menuItem, quantity: 1, notes: '' }] };
    }),

  removeItem: (menuItemId) =>
    set((state) => ({
      items: state.items.filter((i) => i.menuItem.id !== menuItemId),
    })),

  updateQuantity: (menuItemId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return { items: state.items.filter((i) => i.menuItem.id !== menuItemId) };
      }
      return {
        items: state.items.map((i) =>
          i.menuItem.id === menuItemId ? { ...i, quantity } : i
        ),
      };
    }),

  updateItemNotes: (menuItemId, notes) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.menuItem.id === menuItemId ? { ...i, notes } : i
      ),
    })),

  setOrderNotes: (orderNotes) => set({ orderNotes }),

  getTotal: () =>
    get().items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0),

  getItemCount: () =>
    get().items.reduce((sum, i) => sum + i.quantity, 0),

  clearCart: () => set({ tableId: null, items: [], orderNotes: '' }),
}));
