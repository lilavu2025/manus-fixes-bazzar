import { useRef, useEffect } from 'react';
import { EnhancedPerformanceMonitor as PerformanceMonitor } from '@/utils/enhancedPerformanceMonitor';
import { useEnhancedToast } from './useEnhancedToast';

export const usePerformanceMonitor = () => {
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const enhancedToast = useEnhancedToast();

  useEffect(() => {
    monitorRef.current = PerformanceMonitor.getInstance();
    monitorRef.current.init();
    
    // إضافة تحليل الأداء مع التوست
    const checkPerformance = () => {
      const metrics = monitorRef.current?.getMetrics?.() || {};
      
      // تحقق من أداء التحميل
      if ((metrics as any).loadTime && (metrics as any).loadTime > 3000) {
        console.warn('Slow loading detected:', (metrics as any).loadTime);
      }
      
      // تحقق من استخدام الذاكرة - رفع الحد إلى 200MB
      const performanceMemory = (performance as any).memory;
      if (performanceMemory && performanceMemory.usedJSHeapSize > 200000000) { // 200MB بدلاً من 50MB
        console.warn('High memory usage detected:', {
          used: `${Math.round(performanceMemory.usedJSHeapSize / 1024 / 1024)}MB`,
          total: `${Math.round(performanceMemory.totalJSHeapSize / 1024 / 1024)}MB`,
          limit: `${Math.round(performanceMemory.jsHeapSizeLimit / 1024 / 1024)}MB`
        });
        // إزالة التحذير المنبثق - فقط console.warn
        // enhancedToast.warning('memoryUsageHigh');
      }
    };

    const interval = setInterval(checkPerformance, 120000); // كل دقيقتين بدلاً من 30 ثانية

    return () => {
      clearInterval(interval);
      monitorRef.current?.cleanup?.();
    };
  }, [enhancedToast]);

  return {
    getMetrics: () => monitorRef.current?.getMetrics?.() || {},
    logMetrics: () => monitorRef.current?.getMetrics?.(),
    optimizePerformance: () => {
      // مسح ذاكرة التخزين المؤقت
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name));
        });
        enhancedToast.success('cacheCleared');
      }
    }
  };
};
