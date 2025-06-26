import { useRef, useEffect } from 'react';
import { EnhancedPerformanceMonitor as PerformanceMonitor } from '@/utils/enhancedPerformanceMonitor';

export const usePerformanceMonitor = () => {
  const monitorRef = useRef<PerformanceMonitor | null>(null);

  useEffect(() => {
    monitorRef.current = PerformanceMonitor.getInstance();
    monitorRef.current.init();
    return () => {
      monitorRef.current?.cleanup?.();
    };
  }, []);

  return {
    getMetrics: () => monitorRef.current?.getMetrics?.() || {},
    logMetrics: () => monitorRef.current?.getMetrics?.(),
  };
};
