import { useEffect, useRef } from 'react';

/**
 * Hook لتحسين أداء Touch Events على الأجهزة المحمولة
 * يقوم بتعطيل بعض السلوكيات الافتراضية التي قد تتداخل مع Touch gestures
 */
export function useTouchOptimization() {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // منع التصغير/التكبير بالضغط المزدوج
    const preventDoubleTapZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // منع السحب الافتراضي للصفحة أثناء السحب على العنصر
    const preventPageScroll = (e: TouchEvent) => {
      // السماح بالتمرير العمودي فقط
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const startY = touch.clientY;
        
        element.setAttribute('data-start-y', startY.toString());
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const startY = parseInt(element.getAttribute('data-start-y') || '0');
      const deltaY = Math.abs(touch.clientY - startY);
      const deltaX = Math.abs(touch.clientX - (parseInt(element.getAttribute('data-start-x') || '0')));

      // إذا كان السحب أفقياً أكثر من الرأسي، منع التمرير الافتراضي
      if (deltaX > deltaY) {
        e.preventDefault();
      }
    };

    // إضافة المستمعات
    element.addEventListener('touchstart', preventPageScroll, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchstart', preventDoubleTapZoom, { passive: false });

    // تنظيف المستمعات
    return () => {
      element.removeEventListener('touchstart', preventPageScroll);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchstart', preventDoubleTapZoom);
    };
  }, []);

  return elementRef;
}

/**
 * Hook مبسط لتحسين Touch على عنصر واحد
 */
export function useSimpleTouchOptimization<T extends HTMLElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // تحسين الاستجابة للمس
    element.style.touchAction = 'pan-y pinch-zoom';
    element.style.userSelect = 'none';
    (element.style as any).webkitUserSelect = 'none';
    (element.style as any).webkitTouchCallout = 'none';

    // منع تأخير click على iOS
    const handleTouchStart = () => {
      // إزالة delay للClick
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  return ref;
}
