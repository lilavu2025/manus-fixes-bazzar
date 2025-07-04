import React, { useEffect, useState } from 'react';
import './SplashScreen.css';
import { useLanguage } from '@/utils/languageContextUtils';
import config from "@/configs/activeConfig";



interface SplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish, duration = 3000 }) => {
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const { t } = useLanguage();
  

  useEffect(() => {
    // تحريك اللوجو
    const logoTimer = setTimeout(() => {
      setLogoLoaded(true);
    }, 500);

    // تحريك النص
    const textTimer = setTimeout(() => {
      setTextVisible(true);
    }, 1200);

    // بداية الاختفاء
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 800);

    // انهاء الصفحة
    const finishTimer = setTimeout(() => {
      onFinish();
    }, duration);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish, duration]);

  return (
    <div className={`splash-screen ${fadeOut ? 'fade-out' : ''}`}>
      {/* خلفية متدرجة مع تأثير */}
      <div className="splash-background"></div>
      
      {/* محتوى الصفحة */}
      <div className="splash-content">
        {/* حاوية اللوجو */}
        <div className={`logo-container ${logoLoaded ? 'loaded' : ''}`}>
          <div className="logo-wrapper">
            <img 
              src={config.visual.splashScreen}
              alt={t('storeName')}
              className="splash-logo"
              onLoad={() => setLogoLoaded(true)}
            />
            <div className="logo-glow"></div>
          </div>
        </div>

        {/* النص والعنوان */}
        <div className={`text-container ${textVisible ? 'visible' : ''}`}>
          <h1 className="app-title">{t('storeName') || 'متجري الإلكتروني'}</h1>
          <p className="app-subtitle">{t('storeSubtitle') || 'تسوق بثقة وراحة'}</p>
          <div className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>

      {/* دوائر زخرفية */}
      <div className="decoration-circles">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
      </div>

      {/* Footer with version */}
      <div className="splash-footer">
        <div className="app-version">v{config.version || '1.0.0'}</div>
      </div>
    </div>
  );
};

export default SplashScreen;
