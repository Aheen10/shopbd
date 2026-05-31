import { create } from 'zustand';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface CartItem {
  productId: number;
  name: string;
  price: number;
  emoji: string;
  quantity: number;
}

type Language = 'en' | 'bn';

interface Store {
  // Auth
  user: User | null;
  token: string | null;
  setUser: (user: User, token: string) => void;
  logout: () => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: number) => void;
  updateQty: (productId: number, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;

  // Language
  language: Language;
  toggleLanguage: () => void;
  setLanguage: (lang: Language) => void;
}

export const useStore = create<Store>((set, get) => ({
  // Auth
  user: null,
  token: null,
  setUser: (user, token) => {
    localStorage.setItem('shopbd_token', token);
    localStorage.setItem('shopbd_user', JSON.stringify(user));
    set({ user, token });
  },
  logout: () => {
    localStorage.removeItem('shopbd_token');
    localStorage.removeItem('shopbd_user');
    set({ user: null, token: null });
  },

  // Cart
  cart: [],
  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        ),
      });
    } else {
      set({ cart: [...cart, item] });
    }
  },
  removeFromCart: (productId) =>
    set({ cart: get().cart.filter((i) => i.productId !== productId) }),
  updateQty: (productId, qty) => {
    if (qty <= 0) {
      get().removeFromCart(productId);
      return;
    }
    set({
      cart: get().cart.map((i) =>
        i.productId === productId ? { ...i, quantity: qty } : i
      ),
    });
  },
  clearCart: () => set({ cart: [] }),
  cartTotal: () =>
    get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),

  // Language
  language: typeof window !== 'undefined'
    ? (localStorage.getItem('shopbd_lang') as Language) || 'en'
    : 'en',
  toggleLanguage: () => {
    const newLang = get().language === 'en' ? 'bn' : 'en';
    localStorage.setItem('shopbd_lang', newLang);
    set({ language: newLang });
  },
  setLanguage: (lang) => {
    localStorage.setItem('shopbd_lang', lang);
    set({ language: lang });
  },
}));