import type { Product } from '@/types';

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export type CartContextType = {
  state: CartState;
  addItem: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  getCartItem: (productId: string) => CartItem | undefined;
  getTotalItems: () => number;
  getItemQuantity: (productId: string) => number;
  // Aliases and helpers for compatibility
  cartItems?: CartItem[];
  getTotalPrice?: () => number;
  buyNow?: (product: Product, quantity?: number, selectedSize?: string, selectedColor?: string) => void;
};

export type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; quantity?: number; selectedSize?: string; selectedColor?: string } }
  | { type: 'REMOVE_ITEM'; payload: { id: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: CartItem[] };
