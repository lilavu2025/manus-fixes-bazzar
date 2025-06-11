import React, { useState, useEffect } from 'react';
import { Language, LanguageContextType } from '@/types/language';
import { translations } from '@/translations';
import { isRTL } from '@/utils/languageContextUtils';
import { LanguageContext } from './LanguageContext.context';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('ar');

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
