import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/utils/languageContextUtils";
import "./HorizontalSlider.css";

interface HorizontalSliderProps {
  children: React.ReactNode[];
  title: string;
  viewAllLink?: string;
  itemsPerView?: {
    mobile: number;
    desktop: number;
  };
  maxItems?: {
    mobile: number;
    desktop: number;
  };
  showPartialItems?: boolean;
  centerContent?: boolean;
  emptyMessage?: string;
  emptyButtonText?: string;
  emptyButtonLink?: string;
}

const HorizontalSlider: React.FC<HorizontalSliderProps> = ({
  children,
  title,
  viewAllLink,
  itemsPerView = { mobile: 1, desktop: 4 },
  maxItems = { mobile: 6, desktop: 12 },
  showPartialItems = true,
  centerContent = false,
  emptyMessage,
  emptyButtonText,
  emptyButtonLink,
}) => {
  const { t, isRTL } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  // تحديد إذا كانت الشاشة صغيرة أم كبيرة
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // حساب عدد العناصر المرئية والحد الأقصى
  const currentItemsPerView = isMobile ? itemsPerView.mobile : itemsPerView.desktop;
  const currentMaxItems = isMobile ? maxItems.mobile : maxItems.desktop;
  
  // تحديد العناصر المعروضة
  const displayedItems = children.slice(0, currentMaxItems);
  const showViewAllButton = children.length > currentMaxItems;

  // إذا لم توجد عناصر، عرض رسالة فارغة
  if (children.length === 0) {
    return (
      <section className="bg-white/80 rounded-xl p-6 shadow-sm mb-8">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">{emptyMessage || t("noItemsAvailable")}</p>
          {emptyButtonText && emptyButtonLink && (
            <Button asChild className="mt-4">
              <a href={emptyButtonLink}>{emptyButtonText}</a>
            </Button>
          )}
        </div>
      </section>
    );
  }

  // تحديث حالة أزرار التمرير وتحديد الكرت النشط
  const updateScrollButtons = () => {
    if (!containerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    
    // تحديث حالة الأزرار بشكل دقيق مع مراعاة اتجاه اللغة
    const hasOverflow = scrollWidth > clientWidth + 5; // تحقق من وجود محتوى يتطلب تمرير
    
    if (isRTL) {
      // منطق RTL: في الـ RTL scrollLeft يبدأ من الموقع الأيمن ويصبح سالباً
      // البداية في RTL تكون عند scrollLeft = 0 (أقصى اليمين)
      // النهاية تكون عند scrollLeft سالب (أقصى اليسار)
      const maxNegativeScroll = -(scrollWidth - clientWidth);
      
      // الزر الأيسر (للخلف): يظهر عندما لا نكون في البداية (أقصى اليمين)
      setCanScrollLeft(hasOverflow && scrollLeft < -5);
      // الزر الأيمن (للأمام): يظهر عندما لا نكون في النهاية (أقصى اليسار)  
      setCanScrollRight(hasOverflow && scrollLeft > maxNegativeScroll + 5);
    } else {
      // منطق LTR منفصل تماماً
      setCanScrollLeft(hasOverflow && scrollLeft > 5); // زر الرجوع - يظهر عندما نبتعد عن البداية
      setCanScrollRight(hasOverflow && scrollLeft < scrollWidth - clientWidth - 5); // زر التقدم - يظهر عندما لا نصل للنهاية
    }
    
    // تحديد الكرت النشط للشاشات الصغيرة مع حساب دقيق للمنتصف
    if (isMobile && containerRef.current.firstElementChild) {
      const container = containerRef.current;
      const containerCenter = scrollLeft + clientWidth / 2;
      let closestCardIndex = 0;
      let closestDistance = Infinity;
      
      Array.from(container.children).forEach((child, index) => {
        if (index < displayedItems.length) {
          const childElement = child as HTMLElement;
          const childCenter = childElement.offsetLeft + childElement.offsetWidth / 2;
          const distance = Math.abs(containerCenter - childCenter);
          
          if (distance < closestDistance) {
            closestDistance = distance;
            closestCardIndex = index;
          }
        }
      });
      
      // تحديث الكرت النشط فقط إذا تغير
      if (closestCardIndex !== activeCardIndex) {
        setActiveCardIndex(closestCardIndex);
      }
    }
  };

  useEffect(() => {
    updateScrollButtons();
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      window.addEventListener('resize', updateScrollButtons);
      
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [displayedItems, isMobile, activeCardIndex]);

  // تحديث إضافي للأزرار عند تغيير البيانات
  useEffect(() => {
    // تأخير صغير للتأكد من رندر العناصر
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [displayedItems.length, currentItemsPerView]);

  // تهيئة أولية للأزرار عند التحميل
  useEffect(() => {
    if (isRTL) {
      // تهيئة RTL: البداية من اليمين
      setCanScrollLeft(false); // لا يمكن العودة للخلف في البداية
      setCanScrollRight(displayedItems.length > currentItemsPerView); // يمكن التقدم للأمام إذا كان هناك محتوى أكثر
    } else {
      // تهيئة LTR منفصلة
      setCanScrollLeft(false); // لا يمكن الرجوع في البداية
      setCanScrollRight(displayedItems.length > currentItemsPerView); // يمكن التقدم إذا كان هناك محتوى أكثر
    }
    
    // تحديث دقيق بعد التحميل
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 200);
    
    return () => clearTimeout(timer);
  }, [displayedItems.length, currentItemsPerView, isRTL]);

  // تعيين الكرت الأول كنشط عند التحميل ووضعه في المنتصف
  useEffect(() => {
    if (isMobile && containerRef.current && displayedItems.length > 0) {
      setActiveCardIndex(0);
      
      // تأخير صغير للتأكد من تحميل العناصر
      setTimeout(() => {
        const container = containerRef.current;
        const firstCard = container?.children[0] as HTMLElement;
        
        if (container && firstCard) {
          const containerRect = container.getBoundingClientRect();
          const cardRect = firstCard.getBoundingClientRect();
          
          // حساب الموقع الذي يضع الكرت في المنتصف تماماً
          const containerCenterX = containerRect.width / 2;
          const cardCenterOffset = firstCard.offsetLeft + (cardRect.width / 2);
          const scrollTarget = cardCenterOffset - containerCenterX;
          
          container.scrollTo({
            left: Math.max(0, scrollTarget),
            behavior: 'auto'
          });
        }
      }, 100);
    }
  }, [isMobile, displayedItems.length]);

  // دالة التمرير الاحترافية
  const scroll = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    if (isMobile) {
      // للشاشات الصغيرة: انتقال سلس إلى الكرت التالي مع وضعه في المنتصف تماماً
      const nextIndex = direction === 'right' ? 
        Math.min(activeCardIndex + 1, displayedItems.length - 1) : 
        Math.max(activeCardIndex - 1, 0);
      
      const targetCard = container.children[nextIndex] as HTMLElement;
      if (targetCard) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        
        // حساب الموقع الذي يضع الكرت في المنتصف تماماً
        const containerCenterX = containerRect.width / 2;
        const cardCenterOffset = targetCard.offsetLeft + (cardRect.width / 2);
        const scrollTarget = cardCenterOffset - containerCenterX;
        
        container.scrollTo({
          left: Math.max(0, scrollTarget),
          behavior: 'smooth'
        });
        
        setActiveCardIndex(nextIndex);
      }
    } else {
      // للشاشات الكبيرة: تمرير متعدد الكروت
      const itemWidth = container.firstElementChild?.clientWidth || 0;
      const gap = 8; // gap-2 = 0.5rem = 8px
      const scrollAmount = (itemWidth + gap) * currentItemsPerView;
      
      if (isRTL) {
        // منطق RTL: الزر الأيسر للخلف والزر الأيمن للأمام
        if (direction === 'left') {
          // زر الخلف في RTL - التمرير للخلف (قيمة موجبة)
          container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
          });
        } else {
          // زر الأمام في RTL - التمرير للأمام (قيمة سالبة)
          container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
          });
        }
      } else {
        // منطق LTR منفصل تماماً
        if (direction === 'left') {
          // زر الرجوع في LTR - العودة للبداية
          container.scrollBy({
            left: -scrollAmount,
            behavior: 'smooth'
          });
        } else {
          // زر التقدم في LTR - التقدم للنهاية
          container.scrollBy({
            left: scrollAmount,
            behavior: 'smooth'
          });
        }
      }
    }
  };

  return (
    <section className="bg-white/80 rounded-none sm:rounded-xl p-0 sm:p-4 shadow-sm mb-6 sm:mb-8 overflow-hidden w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 px-4 pt-4 sm:px-0 sm:pt-0">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        
        {/* عرض الكل للشاشات الكبيرة فقط */}
        <div className="flex items-center">
          {showViewAllButton && viewAllLink && (
            <Button
              asChild
              variant="outline"
              className="font-bold py-2 px-6 rounded-full border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg text-gray-700 hover:text-blue-600"
            >
              <a href={viewAllLink}>{t("viewAll")}</a>
            </Button>
          )}
        </div>
      </div>

      {/* Slider Container مع الأزرار الجانبية */}
      <div className="relative" dir={isRTL ? "rtl" : "ltr"}>
        
        {/* الحاوي الرئيسي للسلايدر */}
        <div className="overflow-visible">
          <div
            ref={containerRef}
            className={`
              horizontal-slider-container flex gap-0 sm:gap-2 overflow-x-auto scrollbar-hide
              ${showPartialItems ? 'snap-x snap-mandatory' : ''}
              scroll-smooth
            `}
            style={{
              scrollBehavior: 'smooth'
            } as React.CSSProperties & { WebkitOverflowScrolling?: string }}
          >
            {displayedItems.map((child, index) => {
              // تحديد موقع الكرت بالنسبة للكرت النشط
              let positionClass = '';
              if (isMobile) {
                if (index === activeCardIndex) {
                  positionClass = 'active-card';
                } else if (index < activeCardIndex) {
                  positionClass = 'left-side';
                } else {
                  positionClass = 'right-side';
                }
              }
              
              return (
                <div
                  key={index}
                  className={`horizontal-slider-item flex-shrink-0 ${showPartialItems ? 'snap-center' : ''} ${positionClass}`}
                >
                  {child}
                </div>
              );
            })}
            
            {/* عنصر فارغ للمساعدة في التمرير */}
            {displayedItems.length > currentItemsPerView && (
              <div className="w-4 flex-shrink-0" />
            )}
          </div>
        </div>
        
        {/* زر التقدم للأمام - في الشمال للـ RTL وفي اليمين للـ LTR */}
        {!isMobile && (
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll('right');
            }}
            disabled={!canScrollRight}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? '-left-6' : '-right-6'} h-12 w-12 bg-white/90 backdrop-blur-md shadow-xl border-0 hover:bg-white hover:scale-110 transition-all duration-300 rounded-full group z-20 disabled:opacity-30`}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {isRTL ? <ChevronLeft className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" /> : <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />}
          </Button>
        )}
        
        {/* زر العودة للخلف - في اليمين للـ RTL وفي اليسار للـ LTR */}
        {!isMobile && (
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              scroll('left');
            }}
            disabled={!canScrollLeft}
            className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? '-right-6' : '-left-6'} h-12 w-12 bg-white/90 backdrop-blur-md shadow-xl border-0 hover:bg-white hover:scale-110 transition-all duration-300 rounded-full group z-20 disabled:opacity-30`}
            style={{
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12), 0 4px 16px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            {isRTL ? <ChevronRight className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" /> : <ChevronLeft className="h-6 w-6 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />}
          </Button>
        )}
        
      </div>

      {/* زر عرض الكل للشاشات الصغيرة */}
      {isMobile && showViewAllButton && viewAllLink && (
        <div className="mt-6 text-center px-4 pb-4">
          <Button
            asChild
            variant="outline"
            className="font-bold py-3 px-8 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 border-2"
          >
            <a href={viewAllLink}>{t("viewAll")}</a>
          </Button>
        </div>
      )}

    </section>
  );
};

export default HorizontalSlider;
