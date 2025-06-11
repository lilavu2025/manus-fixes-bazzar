// Utilities for LanguageContext
import { Language } from '@/types/language';
import { useContext } from 'react';
import { LanguageContextType } from '@/types/language';
import { LanguageContext } from '@/contexts/LanguageContext.context';

export const isRTL = (language: Language) => language === 'ar' || language === 'he';

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export type { Language } from '@/types/language';
