import React, { useState, useEffect } from 'react';
import { Language, LanguageContextType } from '@/types/language';
import { translations } from '@/translations';
import { isRTL } from '@/utils/languageContextUtils';
import { LanguageContext } from './LanguageContext.context';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // جلب اللغة من localStorage أو الافتراضية
    const stored = typeof window !== 'undefined' ? localStorage.getItem('language') : null;
    return (stored as Language) || 'ar';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', lang);
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
