// src/configs/users-configs/example-store.ts
import createConfig from "../createConfig";

// مثال على تكوين عميل جديد
const config = createConfig({
  appId: "com.mtgary.exampleStore",

  names: {
    ar: "متجر المثال",
    en: "Example Store",
    he: "חנות לדוגמה",
  },

  descriptions: {
    ar: "متجر إلكتروني للمنتجات المتنوعة",
    en: "E-commerce store for various products",
    he: "חנות אינטרנט למוצרים שונים",
  },

  visual: {
    logo: "/assets/logos/exampleStore.png",
    splashScreen: "/assets/splash/exampleStore.png",
    primaryColor: "#2D3748",
    secondaryColor: "#4FD1C5",
    fontFamily: "Inter, sans-serif",
  },

  defaultLanguage: "ar",
  rtl: true,

  // ✅ البيانات الحساسة (supabaseUrl, supabaseKey, siteId, netlifyToken) 
  // سيتم تحميلها تلقائياً من ملف envs/example.env
}, "example"); // اسم العميل يجب أن يتطابق مع اسم ملف .env

export default config;
