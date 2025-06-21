import { useOrdersWithDetailsQuery } from '@/integrations/supabase/reactQueryHooks';

// Hook جلب الطلبات مع تفاصيلها للوحة تحكم الأدمن
export function useOrdersRealtime() {
  const { data, isLoading, error, refetch } = useOrdersWithDetailsQuery();
  return {
    orders: data || [],
    loading: isLoading,
    error,
    refetch,
    setOrders: () => {}, // placeholder للتوافق مع الكود القديم
  };
}
