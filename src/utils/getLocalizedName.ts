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

// Utility to get localized description for product
export function getLocalizedDescription(
  obj: { description?: string; descriptionEn?: string; descriptionHe?: string; description_ar?: string; description_en?: string; description_he?: string },
  language: Language
): string {
  if (!obj) return '';
  if (language === 'ar') return obj.description || obj.description_ar || '';
  if (language === 'en') return obj.descriptionEn || obj.description_en || obj.description || '';
  if (language === 'he') return obj.descriptionHe || obj.description_he || obj.description || '';
  return obj.description || '';
}
