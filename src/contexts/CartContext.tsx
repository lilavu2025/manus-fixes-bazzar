import React, { createContext, useContext, useReducer, ReactNode, useRef } from "react";
import { Product } from "@/types";
import { useAuth } from "@/contexts/useAuth";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { user, profile, session, loading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [cookieCartLoaded, setCookieCartLoaded] = useState(false);

  // hooks
  // استخدام session بدلاً من user لتحديد إذا كان المستخدم مسجلاً
  const sessionUser = session as { user?: { id?: string } } | null;
  const isLoggedIn = Boolean(sessionUser?.user?.id);
  const userId = sessionUser?.user?.id || "";
  
  const navigate = useNavigate();
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeFromCartMutation = useRemoveFromCart();
  const clearUserCartMutation = useClearUserCart();
  const setCartQuantityMutation = useSetCartQuantity();

  // جلب السلة من قاعدة البيانات للمستخدم المسجل
  const { data: dbCartData, isLoading: isCartLoading, refetch: refetchCart } = useGetUserCart(userId);

  // تحميل السلة من الكوكيز عند عدم وجود مستخدم
  useEffect(() => {
    if (!isLoggedIn && !cookieCartLoaded && !loading) {
      // تأخير قصير للتأكد من استقرار الحالة
      const timeoutId = setTimeout(() => {
        const savedCart = getCookie("cart");
        console.log("Checking for saved cart in cookies...", savedCart ? "Found" : "Not found");
        if (savedCart) {
          try {
            const cartItems = JSON.parse(savedCart);
            console.log("Parsed cart items from cookies:", cartItems);
            // تحقق من أن البيانات صالحة وليست فارغة
            if (Array.isArray(cartItems) && cartItems.length > 0) {
              // تحميل السلة فقط إذا كانت السلة الحالية فارغة
              if (state.items.length === 0) {
                dispatch({ type: "LOAD_CART", payload: cartItems });
                console.log("Cart loaded from cookies:", cartItems.length, "items");
              }
            } else {
              console.log("Cookie cart is empty or invalid, skipping load");
              // مسح الكوكيز الفارغة
              deleteCookie("cart");
            }
          } catch (error) {
            console.error("Error loading cart from cookies:", error);
            // مسح الكوكيز المعطوبة
            deleteCookie("cart");
          }
        }
        setCookieCartLoaded(true);
      }, 100); // تقليل التأخير إلى 100ms

      return () => clearTimeout(timeoutId);
    }
  }, [user, cookieCartLoaded, state.items.length]);

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
    // فقط للمستخدمين غير المسجلين وبعد التحميل الأولي
    if (!user && cookieCartLoaded && state.items.length > 0) {
      console.log("Saving cart to cookies:", state.items.length, "items");
      setCookie("cart", JSON.stringify(state.items), 60 * 60 * 24 * 7);
    } else if (!user && cookieCartLoaded && state.items.length === 0) {
      // إذا كانت السلة فارغة، امسح الكوكيز
      deleteCookie("cart");
      console.log("Cart is empty, cookies cleared");
    }
  }, [state.items, user, cookieCartLoaded]);

  // نقل العناصر من الكوكيز إلى قاعدة البيانات عند تسجيل الدخول (مرة واحدة فقط)
  const [hasMigrated, setHasMigrated] = useState(() => {
    // تحقق من localStorage لمعرفة إذا تم النقل مسبقاً لهذا المستخدم
    if (typeof window !== 'undefined' && userId) {
      return localStorage.getItem(`cart_migrated_${userId}`) === 'true';
    }
    return false;
  });

  // ref لمنع تكرار migration أثناء المعالجة
  const migrationInProgress = useRef(false);

  useEffect(() => {
    const migrateCartFromCookies = async () => {
      if (user && userId && !hasMigrated && !migrationInProgress.current) {
        // تحقق مرة أخرى من localStorage
        const migrationKey = `cart_migrated_${userId}`;
        if (localStorage.getItem(migrationKey) === 'true') {
          setHasMigrated(true);
          return;
        }

        // تعيين flag معالجة لمنع التكرار
        migrationInProgress.current = true;

        const savedCart = getCookie("cart");
        console.log("Checking cart migration:", { userId, savedCart: !!savedCart, hasMigrated });
        
        if (savedCart) {
          try {
            const cookieCartItems = JSON.parse(savedCart);
            console.log("Cookie cart items:", cookieCartItems);
            
            if (Array.isArray(cookieCartItems) && cookieCartItems.length > 0) {
              console.log("Migrating cart from cookies to database...");
              
              // تعيين flag أولاً للسرعة
              setHasMigrated(true);
              localStorage.setItem(migrationKey, 'true');
              
              // نقل كل عنصر من الكوكيز إلى قاعدة البيانات بشكل متوازي للسرعة
              const migrationPromises = cookieCartItems.map(async (item) => {
                try {
                  // التحقق من صحة بيانات المنتج
                  if (!item.product || !item.product.id || !item.quantity) {
                    console.warn("Invalid cart item:", item);
                    return { success: false, error: 'Invalid item' };
                  }
                  
                  console.log("Migrating item:", item.product.id, "quantity:", item.quantity);
                  await setCartQuantityMutation.mutateAsync({
                    userId,
                    productId: item.product.id,
                    quantity: item.quantity,
                  });
                  return { success: true };
                } catch (error) {
                  console.error("Error migrating cart item:", error);
                  return { success: false, error };
                }
              });
              
              // انتظار جميع العمليات
              const results = await Promise.allSettled(migrationPromises);
              const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
              const failureCount = results.length - successCount;
              
              console.log(`Cart migration completed: ${successCount} success, ${failureCount} failures`);
              
              // مسح الكوكيز بعد النقل
              deleteCookie("cart");
              
              // إعادة جلب السلة من قاعدة البيانات
              refetchCart();
            } else {
              console.log("No items in cookie cart to migrate");
              localStorage.setItem(migrationKey, 'true');
              setHasMigrated(true);
            }
          } catch (error) {
            console.error("Error migrating cart from cookies:", error);
            // في حالة الخطأ، لا نضع flag حتى يتم إعادة المحاولة
            setHasMigrated(false);
            localStorage.removeItem(migrationKey);
          } finally {
            // إعادة تعيين flag المعالجة
            migrationInProgress.current = false;
          }
        } else {
          console.log("No cart in cookies to migrate");
          localStorage.setItem(migrationKey, 'true');
          setHasMigrated(true); // لا توجد كوكيز للنقل
          migrationInProgress.current = false;
        }
      }
    };

    migrateCartFromCookies();
  }, [user, userId]); // إزالة hasMigrated و setCartQuantityMutation و refetchCart من dependencies

  // تنظيف localStorage عند تسجيل الخروج
  useEffect(() => {
    if (!user && hasMigrated) {
      // عند تسجيل الخروج، إعادة تعيين flag migration
      setHasMigrated(false);
      // حذف جميع migration flags من localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('cart_migrated_')) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [user, hasMigrated]);

  // مسح السلة بالكامل عند تسجيل الخروج الفعلي (وليس عند إعادة التحميل)
  useEffect(() => {
    // تمييز التحميل الأولي عن تسجيل الخروج الفعلي
    if (isInitialLoad) {
      setIsInitialLoad(false);
      return;
    }
    
    // فقط عند تسجيل الخروج الفعلي (بعد أن كان user موجود)
    if (!user) {
      // مسح السلة المحلية فقط، بدون حفظ في الكوكيز
      dispatch({ type: "CLEAR_CART" });
      // مسح كوكيز السلة أيضاً لمنع تحميل سلة فارغة
      deleteCookie("cart");
      console.log("Cart and cookies fully cleared on logout");
      // إعادة تعيين flags
      setHasLoadedFromDB(false);
    }
  }, [user, isInitialLoad]);

  // التعامل مع purchase intent بعد تسجيل الدخول
  useEffect(() => {
    if (user && userId) {
      const purchaseIntent = localStorage.getItem('purchase_intent');
      const checkoutIntent = localStorage.getItem('checkout_intent');
      
      // إذا وُجد purchase_intent، له الأولوية ونلغي checkout_intent
      if (purchaseIntent) {
        try {
          const intent = JSON.parse(purchaseIntent);
          const isRecentIntent = Date.now() - intent.timestamp < 10 * 60 * 1000; // 10 دقائق
          
          if (isRecentIntent && intent.action === 'buyNow') {
            console.log("Processing purchase intent after login:", intent);
            
            // مسح كلا الـ intents لتجنب التضارب
            localStorage.removeItem('purchase_intent');
            localStorage.removeItem('checkout_intent');
            
            // تنفيذ الشراء وانتظار الإنتهاء قبل التوجيه
            const processPurchaseAndNavigate = async () => {
              try {
                console.log("Clearing cart and adding product for buyNow...");
                await clearCart();
                await addItem(intent.product, intent.quantity);
                console.log("Purchase intent processed successfully, navigating to checkout");
                
                // التوجه لصفحة الدفع بعد إتمام العملية
                navigate('/checkout', { 
                  state: { 
                    directBuy: true, 
                    product: intent.product, 
                    quantity: intent.quantity 
                  } 
                });
              } catch (error) {
                console.error("Error in purchase processing:", error);
                // في حالة الخطأ، التوجه مع البيانات على الأقل
                navigate('/checkout', { 
                  state: { 
                    directBuy: true, 
                    product: intent.product, 
                    quantity: intent.quantity 
                  } 
                });
              }
            };
            
            // تنفيذ العملية
            processPurchaseAndNavigate();
          } else {
            // إزالة intent منتهي الصلاحية
            localStorage.removeItem('purchase_intent');
          }
        } catch (error) {
          console.error("Error processing purchase intent:", error);
          localStorage.removeItem('purchase_intent');
        }
      }
      // إذا لم يوجد purchase_intent، تحقق من checkout_intent
      else if (checkoutIntent) {
        try {
          const intent = JSON.parse(checkoutIntent);
          const isRecentIntent = Date.now() - intent.timestamp < 10 * 60 * 1000; // 10 دقائق
          
          if (isRecentIntent && intent.action === 'checkout' && intent.fromCart) {
            console.log("Processing checkout intent after login:", intent);
            
            // مسح checkout intent أولاً
            localStorage.removeItem('checkout_intent');
            
            // تأخير قصير للسماح بتحميل السلة من الكوكيز أولاً
            setTimeout(() => {
              console.log("Navigating to checkout after cart migration");
              navigate('/checkout');
            }, 500); // تأخير 500ms للتأكد من تحميل السلة
          } else {
            // إزالة intent منتهي الصلاحية
            localStorage.removeItem('checkout_intent');
          }
        } catch (error) {
          console.error("Error processing checkout intent:", error);
          localStorage.removeItem('checkout_intent');
        }
      }
    }
  }, [user, userId]);

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

  // دالة مساعدة للمطور لإعادة تعيين migration (فقط في development)
  const resetMigration = () => {
    if (process.env.NODE_ENV === 'development') {
      setHasMigrated(false);
      if (userId) {
        localStorage.removeItem(`cart_migrated_${userId}`);
      }
      console.log("Migration reset for development testing");
    }
  };

  // إضافة الدالة للـ window للاختبار (development فقط)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      (window as any).resetCartMigration = resetMigration;
      (window as any).checkCartCookies = () => {
        const cart = getCookie("cart");
        console.log("Cart cookies:", cart ? JSON.parse(cart) : null);
      };
      (window as any).checkCartState = () => {
        console.log("Cart state:", {
          items: state.items,
          user: !!user,
          userId,
          hasMigrated,
          hasLoadedFromDB
        });
      };
      (window as any).checkPurchaseIntent = () => {
        const intent = localStorage.getItem('purchase_intent');
        console.log("Purchase intent:", intent ? JSON.parse(intent) : null);
      };
      (window as any).clearPurchaseIntent = () => {
        localStorage.removeItem('purchase_intent');
        console.log("Purchase intent cleared");
      };
      (window as any).checkCheckoutIntent = () => {
        const intent = localStorage.getItem('checkout_intent');
        console.log("Checkout intent:", intent ? JSON.parse(intent) : null);
      };
      (window as any).clearCheckoutIntent = () => {
        localStorage.removeItem('checkout_intent');
        console.log("Checkout intent cleared");
      };
      (window as any).forceCheckoutRedirect = () => {
        window.location.href = '/checkout';
        console.log("Forced redirect to checkout");
      };
    }
  }, [resetMigration, state.items, user, userId, hasMigrated, hasLoadedFromDB]);

  // buyNow: إضافة منتج وبدء الشراء المباشر
  const buyNow = async (product: Product, quantity = 1) => {
    if (userId) {
      // للمستخدمين المسجلين: إضافة المنتج للسلة أولاً ثم التوجه للدفع
      try {
        // مسح السلة الحالية وإضافة المنتج الجديد
        await clearCart();
        await addItem(product, quantity);
        
        // استخدام navigate بدلاً من window.location للحفاظ على الحالة
        navigate('/checkout', { 
          state: { 
            directBuy: true, 
            product: product, 
            quantity: quantity 
          } 
        });
        
        console.log("buyNow completed successfully for user");
      } catch (error) {
        console.error("Error in buyNow:", error);
        // في حالة الخطأ، التوجه مباشرة مع البيانات
        navigate('/checkout', { 
          state: { 
            directBuy: true, 
            product: product, 
            quantity: quantity 
          } 
        });
      }
    } else {
      // للمستخدمين غير المسجلين: حفظ نية الشراء قبل التوجيه لتسجيل الدخول
      const purchaseIntent = {
        product,
        quantity,
        timestamp: Date.now(),
        action: 'buyNow'
      };
      
      // حفظ في localStorage
      localStorage.setItem('purchase_intent', JSON.stringify(purchaseIntent));
      
      // إضافة المنتج للسلة المحلية أولاً وحفظه في كوكيز
      await clearCart();
      dispatch({ type: "ADD_ITEM", payload: { product, quantity } });
      
      // حفظ السلة في الكوكيز للزوار
      const cartItems = [{ id: product.id, product, quantity }];
      setCookie("cart", JSON.stringify(cartItems), 30);
      
      // التوجه لصفحة تسجيل الدخول
      navigate('/auth?redirect=checkout');
    }
  };

  // دالة لحفظ السلة في الكوكيز للزوار (مُستخدمة في buyNow فقط)
  const saveCartToCookies = (cartItems: CartItem[]) => {
    if (!user) { // استخدام !user بدلاً من !userId
      try {
        setCookie("cart", JSON.stringify(cartItems), 30); // حفظ لمدة 30 يوم
        console.log("Cart saved to cookies (manual):", cartItems.length, "items");
      } catch (error) {
        console.error("Error saving cart to cookies:", error);
      }
    }
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
