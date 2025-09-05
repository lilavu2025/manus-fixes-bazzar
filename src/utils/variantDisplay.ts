// Shared helpers to display variant keys/values with i18n-aware fallbacks
export type Lang = 'ar' | 'en' | 'he';

export const toDisplayVariant = (val: any, lang: Lang): string => {
  if (val == null) return '';
  if (typeof val === 'object') {
    const o = val as any;
    if (o.ar || o.en || o.he) {
      if (lang === 'en') return o.en || o.ar || o.he || '';
      if (lang === 'he') return o.he || o.en || o.ar || '';
      return o.ar || o.en || o.he || '';
    }
  }
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return toDisplayVariant(p, lang); } catch { return val; }
  }
  try { return String(val); } catch { return ''; }
};

export const renderVariantChipsHtml = (variant: any, lang: Lang): string => {
  if (!variant) return '';
  try {
    const obj = typeof variant === 'string' ? JSON.parse(variant) : variant;
    if (!obj || typeof obj !== 'object') return '';
    const chips = Object.entries(obj)
      .map(([k, v]) => `
      <span style="display:inline-block;background:#eef2ff;color:#1e40af;border:1px solid #c7d2fe;border-radius:9999px;padding:2px 8px;margin:2px;font-size:11px;">
        ${toDisplayVariant(k, lang)}: ${toDisplayVariant(v, lang)}
      </span>`)
      .join('');
    return chips ? `<div style="margin-top:4px;">${chips}</div>` : '';
  } catch { return ''; }
};
