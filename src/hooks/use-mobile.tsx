import * as React from "react";

// نقطة التحول بين الموبايل والكمبيوتر اللوحي/الكمبيوتر، أي أي عرض أصغر من 768 بيكسل يعتبر "موبايل"
const MOBILE_BREAKPOINT = 768;

// هذا هوك مخصص لاكتشاف ما إذا كانت الشاشة تعتبر "موبايل" أم لا
export function useIsMobile() {
  // الحالة التي نستخدمها لتخزين ما إذا كانت الشاشة موبايل أو لا
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  // تأثير جانبي يتم تنفيذه عند تحميل المكون لأول مرة فقط
  React.useEffect(() => {
    // إنشاء media query للتحقق من حجم الشاشة
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    // دالة يتم استدعاؤها عند تغيير حجم الشاشة
    const onChange = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      console.log(`[useIsMobile] Window resized. isMobile: ${mobile}`);
      setIsMobile(mobile);
    };

    // تسجيل المستمع عند تغيير حجم الشاشة
    mql.addEventListener("change", onChange);

    // تعيين القيمة الأولية مباشرة عند تحميل الصفحة
    const initialMobile = window.innerWidth < MOBILE_BREAKPOINT;
    console.log(`[useIsMobile] Initial check. isMobile: ${initialMobile}`);
    setIsMobile(initialMobile);

    // تنظيف المستمع عند إزالة المكون
    return () => {
      console.log("[useIsMobile] Cleanup: removing resize listener");
      mql.removeEventListener("change", onChange);
    };
  }, []); // تنفيذ التأثير مرة واحدة فقط عند التحميل

  // التأكد من أن القيمة ليست undefined قبل الإرجاع (تحويلها إلى boolean صريح)
  console.log(`[useIsMobile] Return value: ${!!isMobile}`);
  return !!isMobile;
}
