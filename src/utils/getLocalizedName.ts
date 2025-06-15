// Utility to get localized name for product or category
import { Language } from '@/types/language';

export function getLocalizedName(
  obj: { name?: string; nameEn?: string; nameHe?: string; name_ar?: string; name_en?: string; name_he?: string },
  language: Language
): string {
  if (!obj) return '';
  if (language === 'ar') return obj.name || obj.name_ar || '';
  if (language === 'en') return obj.nameEn || obj.name_en || obj.name || '';
  if (language === 'he') return obj.nameHe || obj.name_he || obj.name || '';
  return obj.name || '';
}
