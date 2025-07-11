// src/configs/loadEnvConfig.ts

interface EnvConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  siteId?: string;
  netlifyToken?: string;
}

export function loadEnvConfig(clientName: string): EnvConfig {
  // في بيئة المتصفح، نحتاج إلى استخدام متغيرات البيئة من Vite
  // Vite يحمل المتغيرات من ملف .env في جذر المشروع
  
  let envConfig: EnvConfig = {};
  
  // التحقق من البيئة - إذا كانت Node.js أو Vite
  if (typeof process !== 'undefined' && process.env) {
    // بيئة Node.js - استخدم process.env
    envConfig = {
      supabaseUrl: process.env.VITE_SUPABASE_URL,
      supabaseKey: process.env.VITE_SUPABASE_KEY,
      siteId: process.env.VITE_NETLIFY_SITE_ID,
      netlifyToken: process.env.VITE_NETLIFY_TOKEN,
    };
  } else if (typeof import.meta !== 'undefined' && import.meta.env) {
    // بيئة Vite - استخدم import.meta.env
    envConfig = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      supabaseKey: import.meta.env.VITE_SUPABASE_KEY,
      siteId: import.meta.env.VITE_NETLIFY_SITE_ID,
      netlifyToken: import.meta.env.VITE_NETLIFY_TOKEN,
    };
  }
  
  // إذا لم تكن المتغيرات موجودة، نحاول الحصول على القيم من ملف .env الخاص بالعميل
  // هذا يحدث عادة في بيئة التطوير
  if (!envConfig.supabaseUrl || !envConfig.supabaseKey) {
    if (import.meta.env.DEV) {
      console.warn(`⚠️  لم يتم العثور على متغيرات البيئة للعميل ${clientName}`);
      console.warn(`💡 تأكد من وجود ملف .env يحتوي على المتغيرات المطلوبة`);
      console.warn(`🔧 أو استخدم الأمر: npm run dev:client ${clientName}`);
    }
  }
  
  return envConfig;
}

// استخراج اسم العميل من اسم الملف
export function getClientNameFromFilename(filename: string): string {
  // مثال: zgayer-store.ts -> zgayer
  const baseName = filename.replace('.ts', '');
  return baseName.split('-')[0];
}
