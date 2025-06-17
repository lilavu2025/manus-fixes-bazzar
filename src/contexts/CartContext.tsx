import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product } from '@/types';
import { useAuth } from '@/contexts/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import type { CartContextType, CartItem, CartState, CartAction } from './CartContext.types';
import { getDisplayPrice } from '@/utils/priceUtils';
import type { Product as ProductFull } from '@/types/product';
import { setCookie, getCookie, deleteCookie } from '../utils/cookieUtils';

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, quantity = 1 } = action.payload;
      const itemId = `${product.id}`;
      
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
  itemCount: 0,
};

/**
 * مزود سياق السلة CartProvider
 * يدير حالة السلة ويوفر دوال التعامل معها.
 */
export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, profile } = useAuth();
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

  // Load cart from cookies on mount
  React.useEffect(() => {
    const savedCart = getCookie('cart');
    if (savedCart) {
      try {
        const cartItems = JSON.parse(savedCart);
        dispatch({ type: 'LOAD_CART', payload: cartItems });
      } catch (error) {
        console.error('Error loading cart from cookies:', error);
      }
    }
  }, []);
  
  // Save cart to cookies whenever it changes
  React.useEffect(() => {
    setCookie('cart', JSON.stringify(state.items), 60 * 60 * 24 * 7); // أسبوع
  }, [state.items]);
  
  const addItem = async (product: Product, quantity = 1) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, quantity } });
    if (user) {
      const { data: existing, error: fetchError } = await supabase
        .from('cart')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .maybeSingle();
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching cart item:', fetchError);
        return;
      }
      if (existing) {
        await supabase
          .from('cart')
          .update({ quantity: existing.quantity + quantity })
          .eq('user_id', user.id)
          .eq('product_id', product.id);
      } else {
        await supabase
          .from('cart')
          .insert({
            user_id: user.id,
            product_id: product.id,
            quantity
          });
      }
    }
  };
  
  const removeItem = async (id: string, productId?: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { id } });
    if (user && productId) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);
    }
  };

  const updateQuantity = async (id: string, quantity: number, productId?: string) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity } });
    if (user && productId) {
      await supabase
        .from('cart')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);
    }
  };

  const clearCart = async () => {
    dispatch({ type: 'CLEAR_CART' });
    if (user) {
      await supabase
        .from('cart')
        .delete()
        .eq('user_id', user.id);
    }
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
  
  // Helper: حساب المجموع الكلي للسلة حسب نوع المستخدم
  const getTotalPrice = () => {
    return (state.items as unknown as CartItemFull[]).reduce((sum, item) => sum + (getDisplayPrice(item.product, profile?.user_type) * item.quantity), 0);
  };

  // Aliases for compatibility with old code
  const addToCart = addItem;
  const cartItems = state.items;

  // buyNow: إضافة منتج وبدء الشراء المباشر
  const buyNow = async (product: Product, quantity = 1) => {
    await clearCart();
    await addItem(product, quantity);
  };

  const value: CartContextType & {
    addToCart: typeof addItem;
    cartItems: typeof state.items;
    getTotalPrice: () => number;
    buyNow: typeof buyNow;
    isLoading: boolean;
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
    isLoading,
  };
  
  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
export default CartContext;

type CartItemFull = {
  id: string;
  product: ProductFull;
  quantity: number;
};