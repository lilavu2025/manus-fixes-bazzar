// Helper: pick localized text from a JSON i18n string/object or return raw string
export const toDisplayVariantText = (val: unknown, language: 'ar' | 'en' | 'he' = 'ar'): string => {
  if (val == null) return '';
  // If already an object with i18n keys
  if (typeof val === 'object') {
    const obj = val as any;
    if (obj && (obj.ar || obj.en || obj.he)) {
      if (language === 'en') return obj.en || obj.ar || obj.he || '';
      if (language === 'he') return obj.he || obj.en || obj.ar || '';
      return obj.ar || obj.en || obj.he || '';
    }
  }
  // If it's a string that might be JSON
  if (typeof val === 'string') {
    try {
      const parsed = JSON.parse(val);
      if (parsed && typeof parsed === 'object' && (parsed.ar || parsed.en || parsed.he)) {
        return toDisplayVariantText(parsed, language);
      }
    } catch {
      // not JSON, fall through
    }
    return val;
  }
  // Fallback
  try { return String(val); } catch { return ''; }
};

// Infer current language from document when not provided
const getCurrentLanguage = (): 'ar' | 'en' | 'he' => {
  if (typeof document !== 'undefined') {
    const langAttr = (document.documentElement?.lang || '').toLowerCase();
    if (langAttr.startsWith('en')) return 'en';
    if (langAttr.startsWith('he') || langAttr === 'iw') return 'he';
    // default
    return 'ar';
  }
  return 'ar';
};

// دالة مساعدة لعرض معلومات الفيرنت (تدعم i18n للـ key/value)
export const renderVariantInfo = (
  variantAttributes: string | null | any,
  className?: string,
  language?: 'ar' | 'en' | 'he'
) => {
  if (!variantAttributes) return null;

  try {
    const attributes = typeof variantAttributes === 'string'
      ? JSON.parse(variantAttributes)
      : variantAttributes;
    if (!attributes || typeof attributes !== 'object') return null;
    const lang = language ?? getCurrentLanguage();
    const isRTL = typeof document !== 'undefined' && document?.dir === 'rtl';
    return (
      <div className={`text-xs ${className || 'text-blue-600'} mt-1 flex flex-wrap items-center gap-2`} dir={isRTL ? 'rtl' : 'ltr'}>
        {Object.entries(attributes).map(([key, value]) => (
          <span key={key} className={`bg-blue-100 px-1 rounded`}> {toDisplayVariantText(key, lang)}: {toDisplayVariantText(value, lang)}</span>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error parsing variant attributes:', error);
    return null;
  }
};
