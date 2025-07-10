// scripts/create-client.js
// سكريبت لإنشاء عميل جديد مع ملف التكوين وملف .env

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// قراءة اسم العميل من command line arguments
const clientName = process.argv[2];
const storeName = process.argv[3];

if (!clientName || !storeName) {
  console.log('❌ الاستخدام: node scripts/create-client.js <client-name> <store-name>');
  console.log('مثال: node scripts/create-client.js newclient "New Client Store"');
  process.exit(1);
}

console.log(`🚀 إنشاء عميل جديد: ${clientName}`);
console.log(`📛 اسم المتجر: ${storeName}\n`);

// إنشاء ملف التكوين
const configTemplate = `// src/configs/users-configs/${clientName}-store.ts
import createConfig from "../createConfig";

// التعديلات الخاصة بالمتجر
const config = createConfig({
  appId: "com.mtgary.${clientName}Store",

  names: {
    ar: "${storeName}",
    en: "${storeName}",
    he: "${storeName}",
  },

  descriptions: {
    ar: "وصف المتجر بالعربية",
    en: "Store description in English",
    he: "תיאור החנות בעברית",
  },

  visual: {
    logo: "/assets/logos/${clientName}Store.png",
    splashScreen: "/assets/splash/${clientName}Store.png",
    primaryColor: "#2D3748",
    secondaryColor: "#4FD1C5",
    fontFamily: "Tajawal, sans-serif",
  },

  defaultLanguage: "ar",
  availableLanguages: ["ar", "en", "he"], // اللغات المتاحة - يمكن تعديلها حسب الحاجة
  rtl: true,

  // ✅ البيانات الحساسة (supabaseUrl, supabaseKey, siteId, netlifyToken) 
  // سيتم تحميلها تلقائياً من ملف envs/${clientName}.env
}, "${clientName}"); // اسم العميل يجب أن يتطابق مع اسم ملف .env

export default config;
`;

// إنشاء ملف .env
const envTemplate = `# ملف البيئة للعميل ${clientName}
# يجب استبدال هذه القيم بالقيم الحقيقية للعميل

VITE_CLIENT_KEY=${clientName}
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_KEY=your-supabase-anon-key-here
VITE_NETLIFY_SITE_ID=your-netlify-site-id-here
VITE_NETLIFY_TOKEN=your-netlify-deploy-token-here
`;

try {
  // كتابة ملف التكوين
  const configPath = path.join(__dirname, '..', 'src', 'configs', 'users-configs', `${clientName}-store.ts`);
  fs.writeFileSync(configPath, configTemplate);
  console.log(`✅ تم إنشاء ملف التكوين: ${configPath}`);

  // كتابة ملف .env
  const envPath = path.join(__dirname, '..', 'envs', `${clientName}.env`);
  fs.writeFileSync(envPath, envTemplate);
  console.log(`✅ تم إنشاء ملف البيئة: ${envPath}`);

  console.log('\n🎉 تم إنشاء العميل بنجاح!');
  console.log('\n📝 الخطوات التالية:');
  console.log(`1. قم بتعديل ملف envs/${clientName}.env وأضف القيم الحقيقية`);
  console.log(`2. قم بتعديل ملف src/configs/users-configs/${clientName}-store.ts حسب الحاجة`);
  console.log(`3. أضف الصور المطلوبة في public/assets/logos/ و public/assets/splash/`);

} catch (error) {
  console.error('❌ خطأ في إنشاء العميل:', error.message);
  process.exit(1);
}
