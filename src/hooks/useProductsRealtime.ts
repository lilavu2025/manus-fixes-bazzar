import { useEffect, useState, useCallback } from "react";
import { fetchAllProducts } from "@/integrations/supabase/dataFetchers";
import type { ProductRow } from "@/integrations/supabase/dataFetchers";

// حذف كل منطق الجلسة أو الأحداث من الهوك، والاكتفاء بجلب المنتجات فقط عند التحميل الأول
export function useProductsRealtime() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllProducts();
      setProducts(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts, setProducts };
}
