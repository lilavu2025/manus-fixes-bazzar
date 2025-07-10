// Utilities for LanguageContext
import { Language } from '@/types/language';
import { useContext } from 'react';
import { LanguageContextType } from '@/types/language';
import { LanguageContext } from '@/contexts/LanguageContext.context';
import { logger } from './logger';

export const isRTL = (language: Language) => language === 'ar' || language === 'he';

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Return a safe fallback instead of throwing error
    logger.warn('useLanguage used outside LanguageProvider, using fallback');
    return {
      language: 'ar' as Language,
      setLanguage: () => {},
      t: (key: string) => key,
      isRTL: true
    };
  }
  return context;
};

export type { Language } from '@/types/language';
