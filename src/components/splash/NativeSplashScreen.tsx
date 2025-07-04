import React, { useEffect, useState } from 'react';
import './NativeSplashScreen.css';
import { useLanguage } from "@/utils/languageContextUtils";
import config from "@/configs/activeConfig";


interface NativeSplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const NativeSplashScreen: React.FC<NativeSplashScreenProps> = ({ 
  onFinish, 
  duration = 2500 
}) => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    let timeoutId: number;

    const initializeApp = async () => {
      try {
        // تأخير قليل لإتمام تحميل اللوجو
        setTimeout(() => {
          setLogoLoaded(true);
        }, 300);

        // تأخير آخر لإظهار أن التطبيق جاهز
        setTimeout(() => {
          setAppReady(true);
        }, 1200);

        // إنهاء السبلاش بعد المدة المحددة
        timeoutId = window.setTimeout(() => {
          setIsVisible(false);
          setTimeout(onFinish, 500); // تأخير قليل للانتقال السلس
        }, duration);

      } catch (error) {
        console.warn('Error in splash screen:', error);
        // الاستمرار حتى لو حدث خطأ
        timeoutId = window.setTimeout(() => {
          setIsVisible(false);
          setTimeout(onFinish, 500);
        }, duration);
      }
    };

    initializeApp();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [onFinish, duration]);

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className="native-splash-screen"
      style={{
        '--primary-color': config.visual.primaryColor,
        '--secondary-color': config.visual.secondaryColor
      } as React.CSSProperties}
    >
      <div className="native-splash-background">
        <div className="background-overlay"></div>
      </div>
      
      <div className="native-splash-content">
        <div className={`native-logo-container ${logoLoaded ? 'loaded' : ''}`}>
          <div className="native-logo-wrapper">
            <img 
              src={config.visual.splashScreen}
              alt={t('storeName')}
              className="native-splash-logo"
              onLoad={() => setLogoLoaded(true)}
            />
          </div>
          <div className="logo-shine"></div>
        </div>

        <div className={`native-text-container ${appReady ? 'ready' : ''}`}>
          <h1 className="native-app-title">{t('storeName')}</h1>
          <p className="native-app-subtitle">{t('storeSubtitle') || 'تسوق بثقة وراحة'}</p>

          {appReady && (
            <div className="ready-indicator">
              <div className="ready-checkmark">✓</div>
              <span className="ready-text">{t('readyText') || 'جاهز للاستخدام'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="native-footer">
        <div className="app-version">v{config.version || '1.0.0'}</div>
      </div>
    </div>
  );
};

export default NativeSplashScreen;
