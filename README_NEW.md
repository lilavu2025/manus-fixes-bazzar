# 🛒 Manus Fixes Bazzar - موقع التجارة الإلكترونية

## 🌟 نظرة عامة

موقع تجارة إلكترونية متطور ومتعدد اللغات يدعم العربية والإنجليزية والعبرية مع واجهة مستخدم حديثة وتجربة استخدام متميزة.

## ✨ الميزات الرئيسية

### 🌍 دعم متعدد اللغات
- **العربية**: دعم كامل للكتابة من اليمين إلى اليسار (RTL)
- **الإنجليزية**: واجهة إنجليزية حديثة
- **العبرية**: دعم كامل للكتابة من اليمين إلى اليسار

### 👥 أنظمة المستخدمين
- **مستخدم عادي (Retail)**: التصفح والشراء
- **مستخدم جملة (Wholesale)**: أسعار خاصة وخصومات
- **مدير (Admin)**: إدارة كاملة للموقع

### 🛍️ وظائف التجارة الإلكترونية
- عرض المنتجات مع صور متعددة
- سلة تسوق ذكية
- نظام الطلبات والفواتير
- إدارة العناوين
- نظام المفضلة
- البحث المتقدم

### 📱 تجربة محمولة متميزة
- تصميم متجاوب بالكامل
- شريط تنقل سفلي للهواتف
- تحميل محسن للصور
- أداء عالي على الأجهزة المختلفة

## 🚀 التقنيات المستخدمة

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (Database + Authentication)
- **State Management**: TanStack Query
- **Icons**: Lucide React
- **Routing**: React Router Dom
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (Toast)

## 📋 المتطلبات

- Node.js 18+ 
- npm أو yarn
- حساب Supabase

## ⚡ التثبيت والتشغيل

```bash
# نسخ المشروع
git clone https://github.com/your-repo/manus-fixes-bazzar.git
cd manus-fixes-bazzar

# تثبيت التبعيات
npm install

# إعداد متغيرات البيئة
cp .env.example .env.local
# قم بتعديل .env.local بالقيم الصحيحة

# تشغيل السيرفر التطويري
npm run dev

# بناء للإنتاج
npm run build

# معاينة الإنتاج
npm run preview
```

## 🗂️ هيكل المشروع

```
src/
├── components/          # المكونات القابلة لإعادة الاستخدام
│   ├── ui/             # مكونات واجهة المستخدم الأساسية
│   ├── admin/          # مكونات لوحة الإدارة
│   └── ...
├── pages/              # صفحات التطبيق
├── hooks/              # Custom React Hooks
├── contexts/           # React Contexts
├── utils/              # دوال مساعدة
├── services/           # خدمات API
├── translations/       # ملفات الترجمة
├── types/              # TypeScript Types
└── integrations/       # تكاملات خارجية
```

## 🎯 صفحات النظام

### صفحات العامة
- `/` - الصفحة الرئيسية
- `/products` - عرض المنتجات
- `/product/:id` - تفاصيل المنتج
- `/categories` - التصنيفات
- `/contact` - اتصل بنا
- `/auth` - تسجيل الدخول/التسجيل

### صفحات المستخدم
- `/cart` - سلة التسوق
- `/checkout` - إتمام الطلب
- `/orders` - طلباتي
- `/favorites` - المفضلة
- `/addresses` - العناوين

### صفحات الإدارة
- `/admin` - لوحة التحكم
- `/admin/products` - إدارة المنتجات
- `/admin/orders` - إدارة الطلبات
- `/admin/users` - إدارة المستخدمين
- `/admin/categories` - إدارة التصنيفات

### أدوات المطور
- `/system-test` - فحص شامل للنظام

## 🔧 الإعدادات

### متغيرات البيئة المطلوبة
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
VITE_EMAILJS_SERVICE_ID=your_emailjs_service
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

## 🎨 التخصيص

### الألوان والثيمات
يمكن تخصيص الألوان من خلال `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // ألوانك المخصصة
        }
      }
    }
  }
}
```

### اللغات
إضافة لغة جديدة:

1. أنشئ ملف في `src/translations/[lang].ts`
2. أضف اللغة في `src/utils/languageContextUtils.ts`
3. أضف الخط المناسب في `index.css`

## 📊 مراقبة الأداء

يتضمن النظام أدوات مراقبة الأداء المتقدمة:

- مراقبة استخدام الذاكرة
- قياس أوقات التحميل
- تحسين الصور تلقائياً
- تحميل كسول للمكونات

## 🔒 الأمان

- مصادقة آمنة عبر Supabase
- حماية المسارات حسب الأدوار
- تشفير البيانات الحساسة
- منع هجمات XSS و CSRF

## 🧪 الاختبار

```bash
# فحص TypeScript
npm run type-check

# فحص ESLint
npm run lint

# إصلاح مشاكل ESLint
npm run lint:fix

# اختبار شامل للنظام
# زيارة /system-test في المتصفح
```

## 📱 دعم PWA

المشروع جاهز لتحويله إلى Progressive Web App:

```typescript
// في vite.config.ts
VitePWA({
  registerType: 'autoUpdate',
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}']
  }
})
```

## 🚀 نشر الموقع

### Netlify
```bash
npm run build
# رفع مجلد dist إلى Netlify
```

### Vercel
```bash
npm run build
vercel --prod
```

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push إلى البranch (`git push origin feature/amazing-feature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).

## 📞 التواصل

- **البريد الإلكتروني**: support@manusfixes.com
- **الموقع**: https://manusfixes.netlify.app
- **الدعم**: [إنشاء مشكلة](https://github.com/your-repo/issues)

## 🙏 شكر خاص

شكر خاص لجميع المطورين والمساهمين في المشاريع مفتوحة المصدر المستخدمة في هذا المشروع.

---

**تم بناؤه بـ ❤️ من أجل مجتمع التجارة الإلكترونية العربية**
