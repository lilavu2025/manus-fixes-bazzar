import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { Product } from "@/types";
import { useAuth } from "@/contexts/useAuth";
import { useState, useEffect } from "react";
import type {
  CartContextType,
  CartItem,
  CartState,
  CartAction,
} from "./CartContext.types";
import { getDisplayPrice } from "@/utils/priceUtils";
import type { Product as ProductFull } from "@/types/product";
import { setCookie, getCookie, deleteCookie } from "@/utils/commonUtils";
import {
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
  useClearUserCart,
} from "@/integrations/supabase/reactQueryHooks";

const CartContext = createContext<CartContextType | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, quantity = 1 } = action.payload;
      const itemId = `${product.id}`;

      const existingItem = state.items.find((item) => item.id === itemId);

      if (existingItem) {
        const updatedItems = state.items.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );

        const total = updatedItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );
        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        return { items: updatedItems, total, itemCount };
      } else {
        const newItem: CartItem = {
          id: itemId,
          product,
          quantity,
        };

        const updatedItems = [...state.items, newItem];
        const total = updatedItems.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0,
        );
        const itemCount = updatedItems.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        return { items: updatedItems, total, itemCount };
      }
    }

    case "REMOVE_ITEM": {
      const updatedItems = state.items.filter(
        (item) => item.id !== action.payload.id,
      );
      const total = updatedItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const itemCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      return { items: updatedItems, total, itemCount };
    }

    case "UPDATE_QUANTITY": {
      const { id, quantity } = action.payload;

      if (quantity <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", payload: { id } });
      }

      const updatedItems = state.items.map((item) =>
        item.id === id ? { ...item, quantity } : item,
      );

      const total = updatedItems.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
      const itemCount = updatedItems.reduce(
        (sum, item) => sum + item.quantity,
        0,
      );

      return { items: updatedItems, total, itemCount };
    }

    case "CLEAR_CART":
      return { items: [], total: 0, itemCount: 0 };

    case "LOAD_CART": {
      const items = action.payload;
      const total = items.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0,
      );
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
export const CartProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // hooks
  const userId =
    user &&
    typeof user === "object" &&
    "id" in user &&
    typeof user.id === "string"
      ? user.id
      : "";
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();
  const clearUserCartMutation = useClearUserCart();

  // تحميل السلة من الكوكيز عند عدم وجود مستخدم
  useEffect(() => {
    if (!user) {
      const savedCart = getCookie("cart");
      if (savedCart) {
        try {
          const cartItems = JSON.parse(savedCart);
          dispatch({ type: "LOAD_CART", payload: cartItems });
        } catch (error) {
          console.error("Error loading cart from cookies:", error);
        }
      }
    }
  }, [user]);

  // حفظ السلة في الكوكيز عند التغيير
  useEffect(() => {
    setCookie("cart", JSON.stringify(state.items), 60 * 60 * 24 * 7);
  }, [state.items]);

  // إضافة منتج للسلة
  const addItem = async (product: Product, quantity = 1) => {
    dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
    if (userId) {
      await addToCartMutation.mutateAsync({
        userId,
        productId: product.id,
        quantity,
      });
      // refetchCart();
    }
  };

  // حذف منتج من السلة
  const removeItem = async (id: string, productId?: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
    if (userId && productId) {
      await removeFromCartMutation.mutateAsync({ userId, productId });
      // refetchCart();
    }
  };

  // تحديث كمية منتج في السلة
  const updateQuantity = async (
    id: string,
    quantity: number,
    productId?: string,
  ) => {
    dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
    if (userId && productId) {
      await updateCartItemMutation.mutateAsync({ userId, productId, quantity });
      // refetchCart();
    }
  };

  // حذف كل السلة
  const clearCart = async () => {
    dispatch({ type: "CLEAR_CART" });
    if (userId) {
      await clearUserCartMutation.mutateAsync(userId);
      // refetchCart();
    }
  };

  const isInCart = (productId: string) => {
    return state.items.some((item) => item.product.id === productId);
  };

  const getCartItem = (productId: string) => {
    return state.items.find((item) => item.product.id === productId);
  };

  // Add this function to CartContextType and value
  const getTotalItems = () => {
    return state.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  // Helper: حساب المجموع الكلي للسلة حسب نوع المستخدم
  const getTotalPrice = () => {
    return (state.items as unknown as CartItemFull[]).reduce(
      (sum, item) =>
        sum + getDisplayPrice(item.product, profile?.user_type) * item.quantity,
      0,
    );
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
        const item = state.items.find((item) => item.product.id === productId);
        return item ? item.quantity : 0;
      },
    },
    addToCart, // alias for backward compatibility
    cartItems,
    getTotalPrice,
    buyNow,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
export default CartContext;

type CartItemFull = {
  id: string;
  product: ProductFull;
  quantity: number;
};

// عند الحاجة للوصول إلى خصائص المنتج أو المستخدم:
// const product = item.product as Product;
// const user = authUser as User;
