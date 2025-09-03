// دالة مساعدة لعرض معلومات الفيرنت
export const renderVariantInfo = (variantAttributes: string | null | any, className?: string) => {
  if (!variantAttributes) return null;
  
  try {
    let attributes;
    if (typeof variantAttributes === 'string') {
      attributes = JSON.parse(variantAttributes);
    } else {
      attributes = variantAttributes;
    }
    
    if (!attributes || typeof attributes !== 'object') return null;
    const isRTL = typeof document !== 'undefined' && document?.dir === 'rtl';
    return (
      <div className={`text-xs ${className || 'text-blue-600'} mt-1`} dir={isRTL ? 'rtl' : 'ltr'}>
        {Object.entries(attributes).map(([key, value]) => (
          <span key={key} className={`${isRTL ? 'ml-2' : 'mr-2'} bg-blue-100 px-1 rounded`}>
            {key}: {String(value)}
          </span>
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error parsing variant attributes:', error);
    return null;
  }
};
