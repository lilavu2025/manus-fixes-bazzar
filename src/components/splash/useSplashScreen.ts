import { useState, useEffect } from 'react';

interface UseSplashScreenOptions {
  duration?: number;
  minDisplayTime?: number;
}

export const useSplashScreen = (options: UseSplashScreenOptions = {}) => {
  const { duration = 2500, minDisplayTime = 1000 } = options;
  
  const [isVisible, setIsVisible] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    // تأكد من أن السبلاش يظهر لمدة دنيا
    const minTimePromise = new Promise(resolve => {
      setTimeout(resolve, minDisplayTime);
    });

    // انتظار تحميل الموارد أو المدة المحددة
    const durationPromise = new Promise(resolve => {
      setTimeout(resolve, duration);
    });

    Promise.all([minTimePromise, durationPromise]).then(() => {
      setIsReady(true);
      // إضافة تأخير قليل للانتقال السلس
      setTimeout(() => {
        setIsVisible(false);
      }, 300);
    });

  }, [duration, minDisplayTime]);

  const hideSplash = () => {
    setIsReady(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  return {
    isVisible,
    isReady,
    hideSplash
  };
};
