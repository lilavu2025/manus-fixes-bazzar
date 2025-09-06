import { useOrdersWithDetailsQuery } from "@/integrations/supabase/reactQueryHooks";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Hook جلب الطلبات مع تفاصيلها للوحة تحكم الأدمن مع تحديث محسن للأداء
export function useOrdersRealtime() {
  const intervalRef = useRef<number | null>(null);
  
  const { data, isLoading, error, refetch } = useOrdersWithDetailsQuery({
    refetchInterval: false, // تعطيل التحديث التلقائي المستمر
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // البيانات تعتبر طازجة لمدة 5 دقائق
    gcTime: 10 * 60 * 1000, // الاحتفاظ بالبيانات في الكاش لمدة 10 دقائق
    // ملاحظة: لا نُغيّر queryKey هنا حتى تبقى ['admin-orders-with-details'] ثابتة
  });

  // احتفظ بأحدث refetch في ref لتجنّب إعادة إنشاء الاشتراك
  const refetchRef = useRef(refetch);
  useEffect(() => {
    refetchRef.current = refetch;
  }, [refetch]);

  // تحديث بيانات الطلبات كل دقيقتين فقط كنسخة احتياطية هادئة
  useEffect(() => {
    intervalRef.current = window.setInterval(() => {
      if (!document.hidden) {
        refetchRef.current?.();
      }
    }, 2 * 60 * 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // اشتراك Realtime على جدول الطلبات لتحديث فوري عند أي تغيير
  useEffect(() => {
    const uniqueName = `admin-orders-changes-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let debounceTimer: number | null = null;
    const scheduleRefetch = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        try {
          if (import.meta.env.DEV) console.debug('[orders-realtime] debounced refetch');
          refetchRef.current?.();
        } catch {}
        debounceTimer = null;
      }, 300);
    };
  const channel = supabase
      .channel(uniqueName)
      // تغييرات عامة (احتياطي)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (import.meta.env.DEV) {
          const p:any = payload as any;
          console.debug('[orders-realtime] orders * change', p?.eventType, p?.new?.id || p?.old?.id);
        }
        scheduleRefetch();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "order_items" }, (payload) => {
        if (import.meta.env.DEV) {
          const p:any = payload as any;
          console.debug('[orders-realtime] order_items * change', p?.eventType, p?.new?.order_id || p?.old?.order_id);
        }
        scheduleRefetch();
      })
      // تفعيل refetch سريع عند INSERT (أهم حدث لرؤية الطلب الجديد)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (payload) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] orders INSERT', payload?.new?.id);
        // refetch فوري (بدون انتظار debounce) لإظهار الطلب بسرعة
        try { refetchRef.current?.(); } catch {}
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "order_items" }, (payload) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] order_items INSERT', payload?.new?.order_id);
        try { refetchRef.current?.(); } catch {}
      })
      .subscribe((status) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] channel status', status);
      });

    // قناة بث مشتركة كخطة بديلة (fallback) عند عدم تفعيل replication)
    // ملاحظة: نعيد استخدام القناة إن وُجدت لتفادي خطأ subscribe المتكرر في StrictMode
    const existingBroadcast = (supabase.getChannels?.() || []).find((ch: any) => ch?.topic === 'realtime:orders-feed');
    const broadcast = existingBroadcast || supabase.channel('orders-feed');
    broadcast
      .on('broadcast', { event: 'order_created' }, (payload) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] broadcast order_created', (payload as any)?.payload);
        try { refetchRef.current?.(); } catch {}
      })
      .on('broadcast', { event: 'order_updated' }, (payload) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] broadcast order_updated', (payload as any)?.payload);
        scheduleRefetch();
      })
      .on('broadcast', { event: 'order_deleted' }, (payload) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] broadcast order_deleted', (payload as any)?.payload);
        scheduleRefetch();
      });
    if (!existingBroadcast) {
      broadcast.subscribe((status: any) => {
        if (import.meta.env.DEV) console.debug('[orders-realtime] broadcast channel status', status);
      });
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
  try { if (import.meta.env.DEV) console.debug('[orders-realtime] remove channel'); supabase.removeChannel(channel); } catch {}
      // لا نزيل قناة البث إذا كانت مشتركة مسبقاً (حتى لا نفسد المشتركين الآخرين)
      if (!existingBroadcast) {
        try { if (import.meta.env.DEV) console.debug('[orders-realtime] remove broadcast channel'); supabase.removeChannel(broadcast); } catch {}
      }
    };
  }, []);

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
