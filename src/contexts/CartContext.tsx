import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product } from '@/types';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import type { CartContextType, CartItem, CartState, CartAction } from './CartContext.types';

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1, selectedSize, selectedColor } = action.payload;
      const itemId = `${product.id}-${selectedSize || ''}-${selectedColor || ''}`;
      
      const existingItem = state.items.find(item => item.id === itemId);
      
      if (existingItem) {
        const updatedItems = state.items.map(item =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
        
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        return { items: updatedItems, total, itemCount };
      } else {
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity,
          selectedSize,
          selectedColor
        };
        
        const updatedItems = [...state.items, newItem];
        const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
        
        return { items: updatedItems, total, itemCount };
      }
    }
    
    case 'REMOVE_ITEM': {
      const updatedItems = state.items.filter(item => item.id !== action.payload.id);
      const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return { items: updatedItems, total, itemCount };
    }
    
    case 'UPDATE_QUANTITY': {
      const { id, quantity } = action.payload;
      
      if (quantity <= 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', payload: { id } });
      }
      
      const updatedItems = state.items.map(item =>
        item.id === id ? { ...item, quantity } : item
      );
      
      const total = updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const itemCount = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
      
      return { items: updatedItems, total, itemCount };
    }
    
    case 'CLEAR_CART':
      return { items: [], total: 0, itemCount: 0 };
    
    case 'LOAD_CART': {
      const items = action.payload;
      const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
      const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
      
      return { items, total, itemCount };
    }
    
    default:
      return state;
  }
};

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0
};

/**
 * مزود سياق السلة CartProvider
 * يدير حالة السلة ويوفر دوال التعامل معها.
 */
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Fetch cart items from Supabase for the current user
  const fetchCartItems = React.useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cart')
        .select('*, product:products(*)')
        .eq('user_id', user.id);
      setIsLoading(false);
      if (error) {
        setError(error);
        // إطلاق حدث عام أو toast عند الخطأ
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart-error', { detail: error }));
        }
        // يمكنك أيضاً استخدام toast هنا إذا كان متاحاً
        // toast.error('تعذر تحميل السلة.');
        console.error('Error fetching cart from Supabase:', error);
        return;
      } else {
        setError(null);
      }
      if (Array.isArray(data)) {
        type DBProduct = {
          id: string;
          name_ar: string;
          name_en: string;
          description_ar: string;
          description_en: string;
          price: number;
          original_price?: number;
          wholesale_price?: number;
          image: string;
          images?: string[];
          category_id: string;
          in_stock?: boolean;
          rating?: number;
          reviews_count?: number;
          discount?: number;
          featured?: boolean;
          tags?: string[];
        };
        type CartRow = {
          id: string;
          product: DBProduct;
          quantity: number;
          selectedSize?: string;
          selectedColor?: string;
        };
        const transformedItems = (data as CartRow[]).map((row) => ({
          id: row.id,
          product: {
            id: row.product.id,
            name: row.product.name_ar,
            nameEn: row.product.name_en,
            description: row.product.description_ar,
            descriptionEn: row.product.description_en,
            price: row.product.price,
            originalPrice: row.product.original_price,
            wholesalePrice: row.product.wholesale_price,
            image: row.product.image,
            images: row.product.images || [],
            category: row.product.category_id,
            inStock: row.product.in_stock ?? true,
            rating: row.product.rating || 0,
            reviews: row.product.reviews_count || 0,
            discount: row.product.discount,
            featured: row.product.featured || false,
            tags: row.product.tags || []
          },
          quantity: row.quantity,
          selectedSize: row.selectedSize,
          selectedColor: row.selectedColor
        }));
        dispatch({ type: 'LOAD_CART', payload: transformedItems });
      }
    } catch (error) {
      setIsLoading(false);
      setError(error instanceof Error ? error : new Error(String(error)));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cart-error', { detail: error }));
      }
      // toast.error('حدث خطأ غير متوقع في تحميل السلة.');
      console.error('Exception in fetchCartItems:', error);
    }
  }, [user]);

  // Real-time subscription for cart changes
  useEffect(() => {
    let cartSubscription: ReturnType<typeof supabase.channel> | null = null;
    if (user) {
      fetchCartItems();
      cartSubscription = supabase
        .channel('cart_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchCartItems();
          }
        )
        .subscribe();
      // ملاحظة: تأكد من تنظيف الاشتراك عند unmount أو تغيير المستخدم
      return () => {
        if (cartSubscription) {
          cartSubscription.unsubscribe();
        }
      };
    } else {
      dispatch({ type: 'CLEAR_CART' });
      if (cartSubscription) {
        cartSubscription.unsubscribe();
      }
    }
  }, [user, fetchCartItems]);

  // Load cart from localStorage on mount
  React.useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  React.useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items));
  }, [state.items]);
  
  const addItem = (product: Product, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity, selectedSize, selectedColor } });
  };
  
  const removeItem = (id: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
  };
  
  const updateQuantity = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
  };
  
  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };
  
  const isInCart = (productId: string) => {
    return state.items.some(item => item.product.id === productId);
  };
  
  const getCartItem = (productId: string) => {
    return state.items.find(item => item.product.id === productId);
  };
  
  // Add this function to CartContextType and value
  const getTotalItems = () => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  };
  
  // Aliases for compatibility with old code
  const addToCart = addItem;
  const cartItems = state.items;
  const getTotalPrice = () => state.total;

  // buyNow: إضافة منتج وبدء الشراء المباشر
  const buyNow = (product: Product, quantity = 1, selectedSize?: string, selectedColor?: string) => {
    clearCart();
    addItem(product, quantity, selectedSize, selectedColor);
  };

  const value: CartContextType & {
    addToCart: typeof addItem;
    cartItems: typeof state.items;
    getTotalPrice: () => number;
    buyNow: typeof buyNow;
  } = {
    ...{
      state,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      isInCart,
      getCartItem,
      getTotalItems,
      getItemQuantity: (productId: string) => {
        const item = state.items.find(item => item.product.id === productId);
        return item ? item.quantity : 0;
      },
    },
    addToCart, // alias for backward compatibility
    cartItems,
    getTotalPrice,
    buyNow,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

/**
 * هوك استخدام السلة useCart
 * @returns كائن سياق السلة CartContextType
 * @throws إذا تم استخدامه خارج CartProvider
 */
// export const useCart = (): CartContextType => {
//   const context = useContext(CartContext);
//   if (!context) {
//     throw new Error('useCart must be used within a CartProvider');
//   }
//   return context;
// };

export default CartContext;