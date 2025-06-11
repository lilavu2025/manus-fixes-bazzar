
export type Language = 'ar' | 'en' | 'he';

export interface LanguageContextType {
  language: Language;
  isRTL: boolean;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}
