# متجر إلكتروني متعدد اللغات (manus-fixes-bazzar)

## نبذة عن المشروع

مشروع متجر إلكتروني حديث يدعم العربية، العبرية، والإنجليزية بشكل كامل. يتيح للمستخدمين تصفح وشراء المنتجات بسهولة عبر واجهة مستخدم متقدمة وسريعة الاستجابة، مع دعم كامل للهواتف الذكية وتطبيقات الأجهزة (Android/iOS) عبر Capacitor.

---

## الخصائص الرئيسية
- دعم كامل للغات: العربية (RTL)، العبرية، والإنجليزية.
- واجهة مستخدم مبنية بـ React وTailwind CSS.
- تطبيق هجين (PWA) مع دعم Capacitor لتطبيقات Android وiOS.
- تسجيل دخول وتوثيق عبر Google ورقم الهاتف (Supabase Auth).
- إدارة سلة التسوق، الطلبات، العناوين، المفضلة، والعروض.
- لوحة تحكم للإدارة (Admin Dashboard) لإدارة المنتجات، الطلبات، والتقارير.
- بحث متقدم وفلاتر ديناميكية للمنتجات.
- إشعارات فورية (Toast) ودعم التحديثات الحية (Realtime) عبر Supabase.
- تحسينات أداء (Virtual Scroll, Lazy Loading, Performance Monitor).
- دعم SEO وMeta Tags وOpen Graph.
- ضغط ملفات الإنتاج (Brotli, Gzip) وتحسين سرعة التحميل.
- تكامل مع EmailJS لإرسال الإشعارات عبر البريد الإلكتروني.
- بنية مرنة وقابلة للتوسع مع فصل واضح للمهام (components, hooks, services, data, lib, ...).

---

## بنية المشروع

```
src/
  components/      # جميع مكونات الواجهة (UI)
  pages/           # صفحات الموقع (منتجات، تفاصيل، سلة، ...)
  services/        # الخدمات (تكامل مع Supabase، إعدادات، ...)
  hooks/           # هوكس مخصصة لإدارة الحالة والمنطق
  data/            # بيانات ثابتة أو Mock Data
  lib/             # مكتبات وأدوات مساعدة
  orders/          # منطق وإدارة الطلبات
  translations/    # ملفات الترجمة
  utils/           # دوال وأدوات مساعدة عامة
public/
  icons/           # أيقونات الموقع
  screenshots/     # صور توضيحية
  manifest.json    # إعدادات PWA
  sw.js            # Service Worker
```

---

## التقنيات والأدوات المستخدمة
- **React** (مع SWC)
- **Vite** (تجميع وتطوير سريع)
- **TypeScript**
- **Tailwind CSS**
- **Supabase** (قاعدة بيانات، توثيق، Realtime)
- **Capacitor** (دعم تطبيقات الأجهزة)
- **Radix UI** (مكونات واجهة متقدمة)
- **EmailJS** (إرسال بريد إلكتروني)
- **TanStack React Query** (إدارة البيانات)
- **PWA** (تطبيق ويب تقدمي)
- **ESLint** (فحص الكود)
- **PostCSS** و**Brotli/Gzip Compression**

---

## طريقة التشغيل والتطوير

1. **تثبيت الحزم:**
   ```bash
   npm install
   ```
2. **تشغيل بيئة التطوير:**
   ```bash
   npm run dev
   ```
3. **بناء نسخة الإنتاج:**
   ```bash
   npm run build
   ```
4. **معاينة نسخة الإنتاج:**
   ```bash
   npm run preview
   ```
5. **فحص الكود:**
   ```bash
   npm run lint
   ```

---

## ملفات مهمة
- `src/App.tsx` : نقطة البداية للتطبيق.
- `src/pages/` : جميع صفحات الموقع.
- `src/components/` : مكونات الواجهة.
- `src/services/supabaseService.ts` : تكامل مع Supabase.
- `public/manifest.json` : إعدادات PWA.
- `vite.config.ts` : إعدادات Vite والمكونات الإضافية.

---

## المجلدات الفرعية المهمة
- **admin/** : مكونات وصفحات الإدارة.
- **addresses/** : إدارة العناوين.
- **orders/** : إدارة الطلبات.
- **translations/** : ملفات الترجمة.

---


