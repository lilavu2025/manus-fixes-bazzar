import { useEffect, useRef } from 'react';

/**
 * Hook لتنظيف الموارد والذاكرة في صفحات الإدارة
 */
export const useMemoryCleanup = () => {
  const timerRefs = useRef<Set<number>>(new Set());
  const intervalRefs = useRef<Set<number>>(new Set());
  const observerRefs = useRef<Set<IntersectionObserver | MutationObserver | PerformanceObserver>>(new Set());

  // دالة لإضافة timer مع تتبع
  const addTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      callback();
      timerRefs.current.delete(timer);
    }, delay);
    
    timerRefs.current.add(timer);
    return timer;
  };

  // دالة لإضافة interval مع تتبع
  const addInterval = (callback: () => void, delay: number) => {
    const interval = window.setInterval(callback, delay);
    intervalRefs.current.add(interval);
    return interval;
  };

  // دالة لإضافة observer مع تتبع
  const addObserver = (observer: IntersectionObserver | MutationObserver | PerformanceObserver) => {
    observerRefs.current.add(observer);
    return observer;
  };

  // دالة لمسح timer محدد
  const clearTimer = (timer: number) => {
    clearTimeout(timer);
    timerRefs.current.delete(timer);
  };

  // دالة لمسح interval محدد
  const clearInterval_ = (interval: number) => {
    clearInterval(interval);
    intervalRefs.current.delete(interval);
  };

  // تنظيف جميع الموارد عند إلغاء تحميل المكون
  useEffect(() => {
    return () => {
      // مسح جميع timers
      timerRefs.current.forEach(timer => clearTimeout(timer));
      timerRefs.current.clear();

      // مسح جميع intervals
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current.clear();

      // قطع اتصال جميع observers
      observerRefs.current.forEach(observer => observer.disconnect());
      observerRefs.current.clear();

      // تشغيل garbage collection إذا كان متاحاً
      if ('gc' in window && typeof (window as any).gc === 'function') {
        try {
          (window as any).gc();
        } catch (e) {
          // تجاهل الأخطاء
        }
      }

      // مسح caches إذا كان متاحاً
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('admin') || name.includes('temp')) {
              caches.delete(name);
            }
          });
        }).catch(() => {
          // تجاهل الأخطاء
        });
      }
    };
  }, []);

  // إضافة تحذير من استهلاك الذاكرة العالي
  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        if (memory && memory.usedJSHeapSize > 300 * 1024 * 1024) { // 300MB بدلاً من 100MB
          console.warn('High memory usage detected:', {
            used: `${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
            total: `${Math.round(memory.totalJSHeapSize / 1024 / 1024)}MB`,
            limit: `${Math.round(memory.jsHeapSizeLimit / 1024 / 1024)}MB`
          });
        }
      }
    };

    const memoryCheckInterval = window.setInterval(checkMemoryUsage, 120000); // كل دقيقتين بدلاً من 30 ثانية
    intervalRefs.current.add(memoryCheckInterval);

    return () => {
      clearInterval(memoryCheckInterval);
      intervalRefs.current.delete(memoryCheckInterval);
    };
  }, []);

  return {
    addTimer,
    addInterval,
    addObserver,
    clearTimer,
    clearInterval: clearInterval_,
    // دالة لمسح جميع الموارد يدوياً
    cleanup: () => {
      timerRefs.current.forEach(timer => clearTimeout(timer));
      timerRefs.current.clear();
      intervalRefs.current.forEach(interval => clearInterval(interval));
      intervalRefs.current.clear();
      observerRefs.current.forEach(observer => observer.disconnect());
      observerRefs.current.clear();
    }
  };
};
