import { useState, useEffect } from 'react';
import { Product, CartItem } from '@/types';
import { setCookie, getCookie } from '@/utils/commonUtils';

const ANONYMOUS_CART_KEY = 'anonymous_cart';

export const useAnonymousCart = () => {
  // حالة حفظ عناصر العربة (الكارت) في الذاكرة المحلية (localStorage)
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // عند تحميل الكومبوننت لأول مرة، نحاول جلب محتويات الكارت من localStorage
  useEffect(() => {
    try {
      console.log('Loading anonymous cart from cookies...');
      const savedCart = getCookie(ANONYMOUS_CART_KEY);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        console.log('Anonymous cart loaded:', parsed);
        setCartItems(Array.isArray(parsed) ? parsed : []);
      } else {
        console.log('No anonymous cart found in cookies.');
      }
    } catch (error) {
      console.error('Error loading anonymous cart from cookies:', error);
      setCartItems([]);
    }
  }, []);

  // كلما تغيرت محتويات الكارت، نحفظها في الكوكيز
  useEffect(() => {
    try {
      console.log('Saving anonymous cart to cookies:', cartItems);
      setCookie(ANONYMOUS_CART_KEY, JSON.stringify(cartItems), 60 * 60 * 24 * 7); // أسبوع
    } catch (error) {
      console.error('Error saving anonymous cart to cookies:', error);
    }
  }, [cartItems]);

  // إضافة منتج للكارت أو تحديث الكمية إذا كان المنتج موجود مسبقاً
  const addToCart = (product: Product, quantity: number = 1) => {
    console.log(`Adding product to anonymous cart:`, product, `Quantity:`, quantity);
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      
      if (existingItem) {
        console.log('Product exists in cart, updating quantity.');
        return prevItems.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: `anonymous_${product.id}_${Date.now()}`,
          product,
          quantity,
        };
        console.log('Product does not exist in cart, adding new item:', newItem);
        return [...prevItems, newItem];
      }
    });
  };

  // إزالة منتج من الكارت حسب المعرف الخاص به
  const removeFromCart = (productId: string) => {
    console.log(`Removing product from anonymous cart with productId: ${productId}`);
    setCartItems(prevItems => 
      prevItems.filter(item => item.product.id !== productId)
    );
  };

  // تحديث كمية منتج في الكارت، وإذا كانت الكمية صفر أو أقل نحذف المنتج
  const updateQuantity = (productId: string, quantity: number) => {
    console.log(`Updating quantity for productId ${productId} to ${quantity}`);
    if (quantity <= 0) {
      console.log('Quantity is zero or less, removing product from cart');
      removeFromCart(productId);
      return;
    }

    setCartItems(prevItems =>
      prevItems.map(item =>
        item.product.id === productId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // مسح كامل الكارت
  const clearCart = () => {
    console.log('Clearing anonymous cart');
    setCartItems([]);
  };

  // حساب عدد العناصر الكلي في الكارت
  const getTotalItems = () => {
    const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);
    console.log('Total items in anonymous cart:', totalItems);
    return totalItems;
  };

  // حساب السعر الإجمالي لكل العناصر في الكارت
  const getTotalPrice = () => {
    const totalPrice = cartItems.reduce((total, item) => {
      const price = item.product?.price || 0;
      const quantity = item.quantity || 0;
      return total + (price * quantity);
    }, 0);
    console.log('Total price of anonymous cart:', totalPrice);
    return totalPrice;
  };

  // جلب كمية منتج معين في الكارت
  const getItemQuantity = (productId: string) => {
    const item = cartItems.find(item => item.product.id === productId);
    const quantity = item ? item.quantity : 0;
    console.log(`Quantity for productId ${productId} is:`, quantity);
    return quantity;
  };

  return {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    getItemQuantity
  };
};
