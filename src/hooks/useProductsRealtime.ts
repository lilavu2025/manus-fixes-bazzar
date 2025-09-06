import { useEffect, useState, useCallback, useRef } from "react";
import { fetchAllProducts } from "@/integrations/supabase/dataFetchers";
import type { ProductRow } from "@/integrations/supabase/dataFetchers";
import { supabase } from "@/integrations/supabase/client";

// حذف كل منطق الجلسة أو الأحداث من الهوك، والاكتفاء بجلب المنتجات فقط عند التحميل الأول
export function useProductsRealtime() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchProducts = useCallback(async (silent: boolean = false) => {
    // لا نظهر شاشة التحميل إذا كان لدينا بيانات بالفعل أو طلب صامت
    if (!hasLoadedRef.current && !silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await fetchAllProducts();
      setProducts(data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(err as Error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // احتفظ بالمرجع لأحدث دالة الجلب لتجنّب إعادة إنشاء الاشتراك
  const refetchRef = useRef(fetchProducts);
  useEffect(() => {
    refetchRef.current = fetchProducts;
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
    
    // تحديث البيانات كل 5 دقائق فقط عند عدم إخفاء النافذة
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchProducts();
      }
    }, 5 * 60 * 1000); // 5 دقائق

    // تنظيف عند إخفاء النافذة
    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchProducts]);

  // اشتراك realtime على جداول المنتجات والفيرنتس لتحديث فوري
  useEffect(() => {
    const channelName = `admin-products-changes-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let debounceTimer: number | null = null;
    const scheduleRefetch = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        try { refetchRef.current?.(); } catch {}
        debounceTimer = null;
      }, 300); // دمج الأحداث خلال 300ms لتقليل الوميض
    };
    const channel = supabase
      .channel(channelName)
      .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => {
        // تحديث صامت بدون إظهار شاشة تحميل
        scheduleRefetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "product_variants" }, () => {
        scheduleRefetch();
      })
      .subscribe();

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      try { supabase.removeChannel(channel); } catch {}
    };
  }, []);

  // كشف دالة refetchSilent للاستخدام بعد الحفظ
  const refetchSilent = useCallback(() => fetchProducts(true), [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts, refetchSilent, setProducts };
}
