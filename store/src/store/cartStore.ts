import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  stock?: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  itemCount: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const existing = get().items.find((i) => i.id === item.id);
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.id === item.id ? {
                ...i,
                quantity: Math.min(i.quantity + item.quantity, i.stock ?? Number.MAX_SAFE_INTEGER),
                stock: item.stock ?? i.stock,
              } : i
            ),
          }));
        } else {
          set((s) => ({ items: [{ ...item, quantity: Math.min(item.quantity, item.stock ?? Number.MAX_SAFE_INTEGER) }, ...s.items] }));
        }
      },
      removeItem: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      updateQty: (id, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.id !== id)
            : s.items.map((i) => (i.id === id
              ? { ...i, quantity: Math.min(qty, i.stock ?? Number.MAX_SAFE_INTEGER) }
              : i)),
        })),
      clearCart: () => set({ items: [] }),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      total: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    }),
    { name: "minimingle-cart" }
  )
);