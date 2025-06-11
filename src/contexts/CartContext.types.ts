import type { Product } from '@/types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export type CartContextType = {
  state: CartState;
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (id: string, productId?: string) => void;
  updateQuantity: (id: string, quantity: number, productId?: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
  // Aliases and helpers for compatibility
  cartItems?: CartItem[];
  getTotalPrice?: () => number;
  buyNow?: (product: Product, quantity?: number) => void;
  isLoading?: boolean; // سننقلها للمزود فقط
};

export type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };
