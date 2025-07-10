import { useEffect, useRef } from 'react';

/**
 * Custom hook لضمان تساوي ارتفاع العناصر في الـ grid
 * يستخدم JavaScript لفرض تساوي الارتفاع عندما يفشل CSS وحده
 */
export const useEqualHeight = (dependencies: any[] = []) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const equalizeHeights = () => {
      if (!containerRef.current) return;

      // العثور على جميع كروت المنتجات في الحاوي
      const cards = containerRef.current.querySelectorAll('.product-card');
      
      if (cards.length === 0) return;

      // إعادة تعيين الارتفاع أولاً
      cards.forEach((card) => {
        (card as HTMLElement).style.height = 'auto';
        (card as HTMLElement).style.minHeight = '';
      });

      // حساب أكبر ارتفاع
      let maxHeight = 0;
      cards.forEach((card) => {
        const height = card.getBoundingClientRect().height;
        maxHeight = Math.max(maxHeight, height);
      });

      // تطبيق الارتفاع الأكبر على جميع الكروت
      cards.forEach((card) => {
        (card as HTMLElement).style.height = `${maxHeight}px`;
        (card as HTMLElement).style.minHeight = `${maxHeight}px`;
      });
    };

    // تأخير التنفيذ للسماح للمحتوى بالتحميل
    const timer = setTimeout(equalizeHeights, 100);

    // إعادة التطبيق عند تغيير حجم النافذة
    const handleResize = () => {
      setTimeout(equalizeHeights, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // تنظيف
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [dependencies]);

  // إعادة تطبيق عند تغيير المحتوى
  useEffect(() => {
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        setTimeout(() => {
          if (!containerRef.current) return;
          
          const cards = containerRef.current.querySelectorAll('.product-card');
          if (cards.length === 0) return;

          let maxHeight = 0;
          cards.forEach((card) => {
            (card as HTMLElement).style.height = 'auto';
            const height = card.getBoundingClientRect().height;
            maxHeight = Math.max(maxHeight, height);
          });

          cards.forEach((card) => {
            (card as HTMLElement).style.height = `${maxHeight}px`;
          });
        }, 50);
      });

      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
      });

      return () => observer.disconnect();
    }
  }, []);

  return containerRef;
};
