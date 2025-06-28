import { useOrdersWithDetailsQuery } from "@/integrations/supabase/reactQueryHooks";
import { useEffect, useRef } from "react";

// Hook جلب الطلبات مع تفاصيلها للوحة تحكم الأدمن مع تحديث محسن للأداء
export function useOrdersRealtime() {
  const intervalRef = useRef<number | null>(null);
  
  const { data, isLoading, error, refetch } = useOrdersWithDetailsQuery({
    refetchInterval: false, // تعطيل التحديث التلقائي المستمر
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // البيانات تعتبر طازجة لمدة 5 دقائق
    gcTime: 10 * 60 * 1000, // الاحتفاظ بالبيانات في الكاش لمدة 10 دقائق
    queryKey: [],
  });

  // تحديث بيانات الطلبات كل دقيقتين فقط (بدلاً من 3 ثواني)
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      // التحديث فقط إذا كانت النافذة مرئية
      if (!document.hidden) {
        refetch();
      }
    }, 2 * 60 * 1000); // كل دقيقتين

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refetch]);

  // تنظيف عند إخفاء النافذة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      } else if (!document.hidden && !intervalRef.current) {
        intervalRef.current = window.setInterval(() => {
          refetch();
        }, 2 * 60 * 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetch]);

  return {
    orders: data || [],
    loading: isLoading,
    error,
    refetch,
    setOrders: () => {}, // placeholder للتوافق مع الكود القديم
  };
}
