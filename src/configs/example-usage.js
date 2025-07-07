// مثال شامل على كيفية استخدام نظام التكوين الجديد
// هذا المثال يوضح كيفية إنشاء عميل جديد من الصفر

/*
=== خطوات إنشاء عميل جديد ===

1. إنشاء العميل باستخدام الأداة:
   npm run create-client mystore "My Amazing Store"

2. تحديث ملف البيئة:
   عدّل envs/mystore.env وأضف القيم الحقيقية

3. تخصيص التكوين:
   عدّل src/configs/users-configs/mystore-store.ts حسب الحاجة

4. فحص التكوين:
   npm run validate-project

5. اختبار النظام:
   npm run dev:client mystore
*/

// مثال على ملف تكوين مكتمل
// src/configs/users-configs/mystore-store.ts

import createConfig from "../createConfig";

const config = createConfig({
  appId: "com.mtgary.mystoreApp",

  names: {
    ar: "متجر الأحلام",
    en: "Dream Store",
    he: "חנות החלומות",
  },

  descriptions: {
    ar: "أفضل المنتجات لتحقيق أحلامك",
    en: "The best products to fulfill your dreams",
    he: "המוצרים הטובים ביותר להגשמת חלומותיך",
  },

  visual: {
    logo: "/assets/logos/mystoreApp.png",
    splashScreen: "/assets/splash/mystoreApp.png",
    primaryColor: "#6366F1", // Indigo
    secondaryColor: "#EC4899", // Pink
    fontFamily: "Inter, Tajawal, sans-serif",
  },

  defaultLanguage: "ar",
  rtl: true,

  // البيانات الحساسة سيتم تحميلها من envs/mystore.env
  // supabaseUrl, supabaseKey, deploy.siteId, deploy.netlifyToken
}, "mystore");

export default config;

/*
=== ملف البيئة المطابق ===
// envs/mystore.env

VITE_CLIENT_KEY=mystore
VITE_SUPABASE_URL=https://myproject.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_NETLIFY_SITE_ID=12345678-1234-1234-1234-123456789012
VITE_NETLIFY_TOKEN=nfp_your_token_here
*/

/*
=== فحص التكوين ===

بعد إنشاء العميل، يمكنك فحص التكوين:

1. فحص شامل:
   npm run validate-project

2. فحص التطابق:
   npm run test-config

3. فحص ملف البيئة:
   npm run manage-env validate mystore

4. عرض جميع ملفات البيئة:
   npm run manage-env list
*/

/*
=== إدارة ملفات البيئة ===

1. إنشاء نسخة احتياطية:
   npm run manage-env backup mystore

2. نسخ تكوين من عميل آخر:
   npm run manage-env copy existingclient mystore

3. استعادة من نسخة احتياطية:
   npm run manage-env restore mystore
*/

/*
=== البناء والنشر ===

1. بناء العميل:
   npm run build:client mystore

2. بناء جميع العملاء:
   npm run build:all-clients

3. نشر جميع العملاء:
   npm run deploy:all-clients
*/
