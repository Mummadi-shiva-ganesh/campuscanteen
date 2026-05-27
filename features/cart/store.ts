import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  is_veg: boolean;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: { id: string; name: string; price: number; image_url: string | null; category: string; is_veg: boolean }) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getTotals: () => {
    subtotal: number;
    tax: number;
    packaging: number;
    total: number;
    count: number;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            items: [...currentItems, { ...item, quantity: 1 }],
          });
        }
      },

      removeItem: (itemId) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === itemId);

        if (existingItem && existingItem.quantity > 1) {
          set({
            items: currentItems.map((i) =>
              i.id === itemId ? { ...i, quantity: i.quantity - 1 } : i
            ),
          });
        } else {
          set({
            items: currentItems.filter((i) => i.id !== itemId),
          });
        }
      },

      updateQuantity: (itemId, quantity) => {
        const currentItems = get().items;
        if (quantity <= 0) {
          set({ items: currentItems.filter((i) => i.id !== itemId) });
        } else {
          set({
            items: currentItems.map((i) =>
              i.id === itemId ? { ...i, quantity } : i
            ),
          });
        }
      },

      clearCart: () => set({ items: [] }),

      getTotals: () => {
        const items = get().items;
        const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const tax = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
        const packaging = subtotal > 0 ? 10 : 0; // ₹10 handling/packing fee if cart is not empty
        const total = Math.round((subtotal + tax + packaging) * 100) / 100;
        const count = items.reduce((sum, item) => sum + item.quantity, 0);

        return { subtotal, tax, packaging, total, count };
      },
    }),
    {
      name: "campus-canteen-cart", // localStorage key
    }
  )
);
