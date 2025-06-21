import { useOrdersWithDetailsQuery } from '@/integrations/supabase/reactQueryHooks';
import { useEffect } from 'react';

// Hook جلب الطلبات مع تفاصيلها للوحة تحكم الأدمن مع تحديث تلقائي عند تغيير البيانات في قاعدة البيانات
export function useOrdersRealtime() {
  const { data, isLoading, error, refetch } = useOrdersWithDetailsQuery({
    refetchInterval: 3000, // إعادة الجلب كل 3 ثواني
    refetchOnWindowFocus: true,
    queryKey: []
  });

  return {
    orders: data || [],
    loading: isLoading,
    error,
    refetch,
    setOrders: () => {}, // placeholder للتوافق مع الكود القديم
  };
}
