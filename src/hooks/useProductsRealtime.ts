import { useEffect, useState, useCallback } from 'react';
import { fetchAllProducts } from '@/integrations/supabase/dataFetchers';
import type { ProductRow } from '@/integrations/supabase/dataFetchers';

export function useProductsRealtime(options?: { disableRealtime?: boolean }) {
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
    fetchProducts(); // جلب المنتجات دائماً عند أول تحميل
    if (!options?.disableRealtime) {
      // يمكنك إضافة اشتراك Realtime هنا إذا أردت
    }
  }, [fetchProducts, options?.disableRealtime]);

  return { products, loading, error, refetch: fetchProducts, setProducts };
}
