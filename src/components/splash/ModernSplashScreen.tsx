import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from "@/utils/languageContextUtils";
import config from "@/configs/activeConfig";

interface ModernSplashScreenProps {
  onFinish: () => void;
  duration?: number;
}

const ModernSplashScreen: React.FC<ModernSplashScreenProps> = ({ 
  onFinish, 
  duration = 2500 
}) => {
  const { t, isRTL } = useLanguage();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // تدرج للبروجرس
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsVisible(false);
          setTimeout(onFinish, 300);
          return 100;
        }
        return prev + (100 / (duration / 50));
      });
    }, 50);

    return () => clearInterval(progressInterval);
  }, [duration, onFinish]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div 
        className="splash-container"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        transition={{ duration: 0.4 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10000,
          background: `linear-gradient(135deg, ${config.visual.primaryColor}10 0%, ${config.visual.secondaryColor}20 50%, ${config.visual.primaryColor}10 100%)`,
          backdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: isRTL ? 'Cairo, sans-serif' : 'Inter, sans-serif',
          direction: isRTL ? 'rtl' : 'ltr'
        }}
      >
        {/* خلفية متحركة */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%)',
            animation: 'pulse 4s ease-in-out infinite'
          }}
        />

        {/* المحتوى الرئيسي */}
        <motion.div 
          className="splash-content"
          style={{
            textAlign: 'center',
            zIndex: 2,
            maxWidth: '300px',
            width: '100%',
            padding: '0 20px'
          }}
        >
          {/* الشعار */}
          <motion.div
            initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 20,
              delay: 0.2
            }}
            style={{
              marginBottom: '24px',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                margin: '0 auto',
                borderRadius: '20px',
                background: `linear-gradient(45deg, ${config.visual.primaryColor}, ${config.visual.secondaryColor})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 10px 30px ${config.visual.primaryColor}30`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {config.visual.splashScreen ? (
                <img 
                  src={config.visual.splashScreen}
                  alt={t('storeName')}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'contain',
                    filter: 'brightness(1.2)'
                  }}
                />
              ) : (
                <div style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: 'white',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  {(t('storeName') || 'متجر').charAt(0)}
                </div>
              )}
              
              {/* تأثير الإضاءة */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: '-50%',
                  left: '-50%',
                  width: '200%',
                  height: '200%',
                  background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)',
                  borderRadius: '50%'
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            </div>
          </motion.div>

          {/* اسم المتجر */}
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1F2937',
              margin: '0 0 8px 0',
              letterSpacing: '-0.5px'
            }}
          >
            {t('storeName') || 'متجري'}
          </motion.h1>

          {/* الوصف */}
          <motion.p
            initial={{ y: 15, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.6 }}
            style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: '0 0 32px 0',
              fontWeight: '400'
            }}
          >
            {t('storeSubtitle') || 'تسوق بثقة وراحة'}
          </motion.p>

          {/* شريط التقدم */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            style={{
              position: 'relative',
              marginBottom: '16px'
            }}
          >
            <div
              style={{
                width: '100%',
                height: '4px',
                backgroundColor: '#E5E7EB',
                borderRadius: '2px',
                overflow: 'hidden'
              }}
            >
              <motion.div
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${config.visual.primaryColor}, ${config.visual.secondaryColor})`,
                  borderRadius: '2px',
                  transformOrigin: isRTL ? 'right' : 'left'
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.1, ease: "easeOut" }}
              />
            </div>
          </motion.div>

          {/* نص التحميل */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
            style={{
              fontSize: '12px',
              color: '#9CA3AF',
              fontWeight: '500'
            }}
          >
            {Math.round(progress)}% {t('loading') || 'جاري التحميل'}
          </motion.div>
        </motion.div>

        {/* نقاط متحركة في الخلفية */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: `${config.visual.primaryColor}40`,
              top: `${20 + (i * 10)}%`,
              left: `${10 + (i * 10)}%`
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.7, 0.3],
              scale: [1, 1.5, 1]
            }}
            transition={{
              duration: 2 + (i * 0.2),
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            }}
          />
        ))}

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.8; }
          }
          
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap');
        `}</style>
      </motion.div>
    </AnimatePresence>
  );
};

export default ModernSplashScreen;
