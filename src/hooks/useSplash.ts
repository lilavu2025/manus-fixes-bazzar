import { useState, useEffect } from 'react';

interface UseSplashOptions {
  duration?: number;
  enableOnMobile?: boolean;
  enableOnDesktop?: boolean;
}

export const useSplash = (options: UseSplashOptions = {}) => {
  const {
    duration = 3000,
    enableOnMobile = true,
    enableOnDesktop = false
  } = options;

  const [showSplash, setShowSplash] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // التحقق من نوع الجهاز
    const isMobile = window.innerWidth <= 768 || 
                    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // التحقق من Capacitor (تطبيق الهاتف)
    const isNativeApp = !!(window as any).Capacitor;

    // تحديد ما إذا كان يجب عرض السبلاش
    const shouldShowSplash = 
      isNativeApp || 
      (isMobile && enableOnMobile) || 
      (!isMobile && enableOnDesktop);

    // التحقق من إذا تم عرض السبلاش من قبل في هذه الجلسة
    const splashShown = sessionStorage.getItem('splash-shown');

    if (shouldShowSplash && !splashShown) {
      setShowSplash(true);
      sessionStorage.setItem('splash-shown', 'true');
    } else {
      setIsInitialized(true);
    }
  }, [enableOnMobile, enableOnDesktop]);

  const handleSplashFinish = () => {
    setShowSplash(false);
    setIsInitialized(true);
  };

  return {
    showSplash,
    isInitialized,
    handleSplashFinish,
    duration
  };
};
