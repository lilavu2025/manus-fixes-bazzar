// src/utils/fieldVisibilityUtils.ts
import config from '@/configs/activeConfig';
import { Language } from '@/types/language';

/**
 * تحديد ما إذا كان حقل لغة معينة يجب أن يظهر أم لا
 */
export const shouldShowLanguageField = (language: Language): boolean => {
  const availableLanguages = config.availableLanguages || ['ar', 'en', 'he'];
  return availableLanguages.includes(language);
};

/**
 * الحصول على اللغات المتاحة فقط
 */
export const getAvailableLanguages = (): Language[] => {
  return (config.availableLanguages || ['ar', 'en', 'he']) as Language[];
};

/**
 * تحديد ما إذا كان الحقل مطلوب أم لا بناءً على اللغات المتاحة
 */
export const isLanguageFieldRequired = (language: Language): boolean => {
  const availableLanguages = getAvailableLanguages();
  
  // إذا كانت هناك لغة واحدة فقط، فهي مطلوبة
  if (availableLanguages.length === 1) {
    return availableLanguages[0] === language;
  }
  
  // إذا كان هناك أكثر من لغة، العربية مطلوبة دائماً إذا كانت متاحة
  if (language === 'ar' && availableLanguages.includes('ar')) {
    return true;
  }
  
  // إذا العربية غير متاحة، أول لغة متاحة تكون مطلوبة
  if (!availableLanguages.includes('ar')) {
    return language === availableLanguages[0];
  }
  
  return false;
};

/**
 * الحصول على اللغة الافتراضية للحقول المطلوبة
 */
export const getPrimaryLanguage = (): Language => {
  const availableLanguages = getAvailableLanguages();
  
  // إذا العربية متاحة، استخدمها
  if (availableLanguages.includes('ar')) {
    return 'ar';
  }
  
  // وإلا استخدم أول لغة متاحة
  return availableLanguages[0];
};

/**
 * ترجمة أسماء اللغات
 */
export const getLanguageName = (language: Language, currentLang: Language): string => {
  const names = {
    ar: {
      ar: 'العربية',
      en: 'الإنجليزية', 
      he: 'العبرية'
    },
    en: {
      ar: 'Arabic',
      en: 'English',
      he: 'Hebrew'
    },
    he: {
      ar: 'ערבית',
      en: 'אנגלית',
      he: 'עברית'
    }
  };
  
  return names[currentLang]?.[language] || language;
};
