import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import type { Category as AppCategory } from '@/types';

// Add options param to control realtime
export function useCategoriesRealtime(options?: { disableRealtime?: boolean }) {
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    // جلب الفئات
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('*')
      .order('created_at', { ascending: false });
    if (categoriesError) setError(categoriesError as Error);
    // جلب المنتجات
    const { data: productsData } = await supabase
      .from('products')
      .select('id, category_id')
      .eq('active', true);
    // حساب عدد المنتجات لكل فئة
    const productCountMap: Record<string, number> = {};
    (productsData || []).forEach((p: { category_id: string }) => {
      if (!productCountMap[p.category_id]) productCountMap[p.category_id] = 0;
      productCountMap[p.category_id]++;
    });
    // تحويل البيانات إلى النوع المطلوب في الواجهة
    const mapped = (categoriesData || []).map((c: Database['public']['Tables']['categories']['Row']) => ({
      id: c.id,
      name: c.name_ar || c.name_en || '',
      nameEn: c.name_en || '',
      nameHe: c.name_he || '',
      image: c.image,
      count: productCountMap[c.id] || 0,
      active: c.active,
    }));
    setCategories(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    if (options?.disableRealtime) return;
    const channel = supabase
      .channel('categories_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => {
        fetchCategories();
      })
      .subscribe();
    // Refetch on tab visibility
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') fetchCategories();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      channel.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [options?.disableRealtime]);

  // expose setCategories for local UI updates
  return { categories, loading, error, refetch: fetchCategories, setCategories };
}
