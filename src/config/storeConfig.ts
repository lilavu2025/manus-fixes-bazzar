// إعداد مركزي لمعلومات المتجر
/*
    ملاحظة : طالم القيمه فاضيه بياخد الديفولت 
    عبي بس الي بلزمك 
 */
/*
    تغيير الاسم والوصف للموقع يتم عن طريق ملفات الترجمات لتعدد اللغات
    الملفات هم : ar.json, en.json, he.json
*/

export const storeConfig = {
  logo: "", // ضع مسار اللوجو هنا
  theme: {
    primary: "", // لون رئيسي افتراضي
    secondary: "", // لون ثانوي افتراضي
    background: "", // لون الخلفية
    text: "", // لون النص
    accent: "", // لون إضافي (مثلاً لون زر خاص)
    border: "", // لون حدود العناصر
    error: "", // لون رسائل الخطأ
    success: "", // لون رسائل النجاح
    muted: "#6B7280", // لون خلفية ثانوية أو نص ثانوي
    card: "", // لون خلفية البطاقات أو الصناديق
  },
};

// دالة لتطبيق ألوان الثيم تلقائياً على متغيرات CSS
export function applyThemeColors() {
  if (typeof window !== "undefined") {
    const root = document.documentElement;
    const theme = storeConfig.theme;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--background", theme.background);
    root.style.setProperty("--foreground", theme.text);
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--border", theme.border);
    root.style.setProperty("--error", theme.error);
    root.style.setProperty("--success", theme.success);
    root.style.setProperty("--muted", theme.muted);
    root.style.setProperty("--card", theme.card);
  }
}
