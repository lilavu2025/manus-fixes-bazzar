import { useEffect, useRef, useCallback } from 'react';

interface UseSmartRefreshOptions {
  refreshFunction: () => Promise<void> | void;
  interval?: number; // بالميلي ثانية
  maxRetries?: number;
  retryDelay?: number; // بالميلي ثانية
}

export const useSmartRefresh = (options: UseSmartRefreshOptions) => {
  const {
    refreshFunction,
    interval = 300000, // 5 دقائق افتراضياً
    maxRetries = 3,
    retryDelay = 5000 // 5 ثوان
  } = options;

  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const retryCountRef = useRef(0);
  const lastRefreshRef = useRef(Date.now());
  const isRefreshingRef = useRef(false);

  // دالة التحديث الذكية
  const smartRefresh = useCallback(async () => {
    if (isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      await refreshFunction();
      retryCountRef.current = 0; // إعادة تعيين عداد المحاولات عند النجاح
      lastRefreshRef.current = Date.now();
    } catch (error) {
      console.error('Smart refresh failed:', error);
      retryCountRef.current++;
      
      // إعادة المحاولة إذا لم نصل للحد الأقصى
      if (retryCountRef.current < maxRetries) {
        setTimeout(() => {
          smartRefresh();
        }, retryDelay);
      }
    } finally {
      isRefreshingRef.current = false;
    }
  }, [refreshFunction, maxRetries, retryDelay]);

  // بدء التحديث الدوري فقط عندما تكون الصفحة مرئية
  const startRefreshInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      // تحديث فقط إذا كانت الصفحة مرئية
      if (document.visibilityState === 'visible') {
        smartRefresh();
      }
    }, interval);
  }, [interval, smartRefresh]);

  // إيقاف التحديث الدوري
  const stopRefreshInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, []);

  // مراقبة حالة visibility للصفحة
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // عند العودة للصفحة، تحقق إذا مر وقت كافي منذ آخر تحديث
        const timeSinceLastRefresh = Date.now() - lastRefreshRef.current;
        if (timeSinceLastRefresh > interval) {
          smartRefresh();
        }
        startRefreshInterval();
      } else {
        // عند مغادرة الصفحة، أوقف التحديث الدوري
        stopRefreshInterval();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // بدء التحديث إذا كانت الصفحة مرئية حالياً
    if (document.visibilityState === 'visible') {
      startRefreshInterval();
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopRefreshInterval();
    };
  }, [interval, smartRefresh, startRefreshInterval, stopRefreshInterval]);

  return {
    refresh: smartRefresh,
    isRefreshing: isRefreshingRef.current,
    lastRefresh: lastRefreshRef.current,
    retryCount: retryCountRef.current
  };
};

