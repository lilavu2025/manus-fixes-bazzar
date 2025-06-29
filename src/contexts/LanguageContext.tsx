import React, { useState, useEffect, useContext } from 'react';
import { Language, LanguageContextType } from '@/types/language';
import { translations } from '@/translations';
import { isRTL } from '@/utils/languageContextUtils';
import { LanguageContext } from './LanguageContext.context';
import { setCookie, getCookie, deleteCookie } from '@/utils/commonUtils';
import { AuthContext } from './AuthContext.context';
import { ProfileService } from '@/services/supabaseService';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // جلب اللغة من الكوكيز أو الافتراضية
    const stored = typeof window !== 'undefined' ? getCookie('language') : null;
    return (stored as Language) || 'ar';
  });

  // جلب المستخدم من سياق المصادقة
  const auth = useContext(AuthContext);
  const user = auth?.user;

  // مزامنة اللغة مع البروفايل عند تسجيل الدخول
  useEffect(() => {
    if (user && language) {
      ProfileService.updateProfile(user.id, { language });
      deleteCookie('language');
    }
  }, [user, language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      setCookie('language', lang, 60 * 60 * 24 * 365); // سنة
    }
  };

  const rtl = isRTL(language);

  useEffect(() => {
    document.documentElement.dir = rtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [rtl, language]);

  const t = (key: string): string => {
    return translations[language]?.[key as keyof typeof translations.ar] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, isRTL: rtl, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export type { Language };
