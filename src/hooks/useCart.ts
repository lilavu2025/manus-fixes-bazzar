import { useContext } from 'react';
import CartContext from '@/contexts/CartContext';
import type { CartContextType } from '@/contexts/CartContext.types';
import type { Product } from '@/types';

export const useCart = (): CartContextType & {
  addToCart: (product: Product, quantity?: number, variantData?: { variantId?: string; selectedVariant?: Record<string, string> }) => void;
  cartItems: import('@/contexts/CartContext.types').CartItem[];
  getTotalPrice: () => number;
} => {
  const context = useContext(CartContext) as CartContextType & {
    addToCart: (product: Product, quantity?: number, variantData?: { variantId?: string; selectedVariant?: Record<string, string> }) => void;
    cartItems: import('@/contexts/CartContext.types').CartItem[];
    getTotalPrice: () => number;
  };
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default useCart;
