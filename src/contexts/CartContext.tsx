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
  useGetUserCart,
  useSetCartQuantity,
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
  const setCartQuantityMutation = useSetCartQuantity();

  // جلب السلة من قاعدة البيانات للمستخدم المسجل
  const { data: dbCartData, isLoading: isCartLoading, refetch: refetchCart } = useGetUserCart(userId);

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

  // تحميل السلة من قاعدة البيانات عندما يسجل المستخدم دخوله
  const [hasLoadedFromDB, setHasLoadedFromDB] = useState(false);
  useEffect(() => {
    if (user && dbCartData && !hasLoadedFromDB) {
      console.log("Loading cart from database...");
      // تحويل البيانات من قاعدة البيانات إلى تنسيق CartItem
      const cartItems: CartItem[] = dbCartData.map((dbItem: any) => ({
        id: dbItem.product_id,
        product: {
          id: dbItem.product.id,
          name: dbItem.product.name_ar,
          nameEn: dbItem.product.name_en,
          nameHe: dbItem.product.name_he,
          description: dbItem.product.description_ar,
          descriptionEn: dbItem.product.description_en,
          descriptionHe: dbItem.product.description_he,
          price: dbItem.product.price,
          originalPrice: dbItem.product.original_price,
          wholesalePrice: dbItem.product.wholesale_price,
          image: dbItem.product.image,
          images: dbItem.product.images || [],
          category: "", // سيتم تحديثه لاحقاً إذا لزم الأمر
          inStock: dbItem.product.in_stock,
          rating: dbItem.product.rating || 0,
          reviews: dbItem.product.reviews_count || 0,
          discount: dbItem.product.discount,
          featured: dbItem.product.featured,
          tags: dbItem.product.tags || [],
          stock_quantity: dbItem.product.stock_quantity,
          active: dbItem.product.active,
          created_at: dbItem.product.created_at,
        },
        quantity: dbItem.quantity,
      }));
      dispatch({ type: "LOAD_CART", payload: cartItems });
      setHasLoadedFromDB(true);
      console.log("Cart loaded from database:", cartItems.length, "items");
    } else if (!user) {
      // إعادة تعيين الحالة عند تسجيل الخروج
      setHasLoadedFromDB(false);
    }
  }, [user, dbCartData, hasLoadedFromDB]);

  // إعادة تحميل السلة من قاعدة البيانات عند تغيير البيانات
  useEffect(() => {
    if (user && dbCartData && hasLoadedFromDB) {
      console.log("Reloading cart from database due to data change...");
      const cartItems: CartItem[] = dbCartData.map((dbItem: any) => ({
        id: dbItem.product_id,
        product: {
          id: dbItem.product.id,
          name: dbItem.product.name_ar,
          nameEn: dbItem.product.name_en,
          nameHe: dbItem.product.name_he,
          description: dbItem.product.description_ar,
          descriptionEn: dbItem.product.description_en,
          descriptionHe: dbItem.product.description_he,
          price: dbItem.product.price,
          originalPrice: dbItem.product.original_price,
          wholesalePrice: dbItem.product.wholesale_price,
          image: dbItem.product.image,
          images: dbItem.product.images || [],
          category: "",
          inStock: dbItem.product.in_stock,
          rating: dbItem.product.rating || 0,
          reviews: dbItem.product.reviews_count || 0,
          discount: dbItem.product.discount,
          featured: dbItem.product.featured,
          tags: dbItem.product.tags || [],
          stock_quantity: dbItem.product.stock_quantity,
          active: dbItem.product.active,
          created_at: dbItem.product.created_at,
        },
        quantity: dbItem.quantity,
      }));
      dispatch({ type: "LOAD_CART", payload: cartItems });
    }
  }, [dbCartData]);

  // حفظ السلة في الكوكيز عند التغيير (للمستخدمين غير المسجلين فقط)
  useEffect(() => {
    if (!user) {
      setCookie("cart", JSON.stringify(state.items), 60 * 60 * 24 * 7);
    }
  }, [state.items, user]);

  // نقل العناصر من الكوكيز إلى قاعدة البيانات عند تسجيل الدخول (مرة واحدة فقط)
  const [hasMigrated, setHasMigrated] = useState(false);
  useEffect(() => {
    const migrateCartFromCookies = async () => {
      if (user && userId && !hasMigrated) {
        const savedCart = getCookie("cart");
        if (savedCart) {
          try {
            const cookieCartItems = JSON.parse(savedCart);
            if (Array.isArray(cookieCartItems) && cookieCartItems.length > 0) {
              console.log("Migrating cart from cookies to database...");
              // نقل كل عنصر من الكوكيز إلى قاعدة البيانات باستخدام setQuantity بدلاً من add
              for (const item of cookieCartItems) {
                try {
                  await setCartQuantityMutation.mutateAsync({
                    userId,
                    productId: item.product.id,
                    quantity: item.quantity, // تعيين الكمية بدقة بدلاً من الإضافة
                  });
                } catch (error) {
                  console.error("Error migrating cart item:", error);
                }
              }
              // مسح الكوكيز بعد النقل
              deleteCookie("cart");
              console.log("Cart migration completed");
              setHasMigrated(true);
              // إعادة جلب السلة من قاعدة البيانات
              refetchCart();
            }
          } catch (error) {
            console.error("Error migrating cart from cookies:", error);
          }
        } else {
          setHasMigrated(true); // لا توجد كوكيز للنقل
        }
      }
    };

    migrateCartFromCookies();
  }, [user, userId, hasMigrated, setCartQuantityMutation, refetchCart]);

  // إضافة منتج للسلة - Optimistic Updates
  const addItem = async (product: Product, quantity = 1) => {
    if (userId) {
      // للمستخدمين المسجلين: حدث قاعدة البيانات مباشرة
      // React Query سيحدث الواجهة تلقائياً عبر invalidateQueries
      try {
        await addToCartMutation.mutateAsync({
          userId,
          productId: product.id,
          quantity,
        });
        // لا نحتاج تحديث الحالة المحلية - سيتم تحديثها من dbCartData
      } catch (error) {
        console.error("Error adding to cart:", error);
      }
    } else {
      // للمستخدمين غير المسجلين: حدث الحالة المحلية
      dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
    }
  };

  // حذف منتج من السلة - Optimistic Updates
  const removeItem = async (id: string, productId?: string) => {
    if (userId && productId) {
      // للمستخدمين المسجلين: حدث قاعدة البيانات مباشرة
      try {
        await removeFromCartMutation.mutateAsync({ userId, productId });
        // لا نحتاج تحديث الحالة المحلية - سيتم تحديثها من dbCartData
      } catch (error) {
        console.error("Error removing from cart:", error);
      }
    } else {
      // للمستخدمين غير المسجلين: حدث الحالة المحلية
      dispatch({ type: "REMOVE_ITEM", payload: { id } });
    }
  };

  // تحديث كمية منتج في السلة - Optimistic Updates
  const updateQuantity = async (
    id: string,
    quantity: number,
    productId?: string,
  ) => {
    if (userId && productId) {
      // للمستخدمين المسجلين: حدث قاعدة البيانات مباشرة
      try {
        if (quantity <= 0) {
          await removeFromCartMutation.mutateAsync({ userId, productId });
        } else {
          await updateCartItemMutation.mutateAsync({ userId, productId, quantity });
        }
        // لا نحتاج تحديث الحالة المحلية - سيتم تحديثها من dbCartData
      } catch (error) {
        console.error("Error updating cart quantity:", error);
      }
    } else {
      // للمستخدمين غير المسجلين: حدث الحالة المحلية
      dispatch({ type: "UPDATE_QUANTITY", payload: { id, quantity } });
    }
  };

  // حذف كل السلة - Optimistic Updates
  const clearCart = async () => {
    if (userId) {
      // للمستخدمين المسجلين: حدث قاعدة البيانات مباشرة
      try {
        await clearUserCartMutation.mutateAsync(userId);
        // لا نحتاج تحديث الحالة المحلية - سيتم تحديثها من dbCartData
      } catch (error) {
        console.error("Error clearing cart:", error);
      }
    } else {
      // للمستخدمين غير المسجلين: حدث الحالة المحلية
      dispatch({ type: "CLEAR_CART" });
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
