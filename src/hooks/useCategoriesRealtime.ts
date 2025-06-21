import { useCategoriesWithProductCountQuery } from '@/integrations/supabase/reactQueryHooks';

// تم حذف كل منطق التحديث التلقائي أو مراقبة الأحداث أو الاشتراك في realtime. استخدم AuthContext فقط لأي منطق جلسة أو تحديث تلقائي.
export function useCategoriesRealtime() {
  const { data, isLoading, error, refetch } = useCategoriesWithProductCountQuery();
  return {
    categories: data || [],
    loading: isLoading,
    error,
    refetch,
    setCategories: () => {}, // لم يعد هناك setCategories فعلية
  };
}
