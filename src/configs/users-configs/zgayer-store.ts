// src/configs/zgayerStore.ts
import createConfig from "../createConfig";

// التعديلات الخاصة بالمتجر
const config = createConfig({
  appId: "com.mtgary.zgayerStore",

  names: {
  ar: "شركة زغير للقوالب",
  en: "ZGAYER DIES CO.",
  he: "זגייר מבלטים בע\"מ",
},

descriptions: {
  ar: " دقة عالية وحلول احترافية لتصنيع القوالب",
  en: "Precision & Professional Die Solutions",
  he: " פתרונות מקצועיים ומדויקים לייצור מבלטים",
}
,

  visual: {
    logo: "/assets/logos/zgayerStore.png",
    splashScreen: "/assets/splash/zgayerStore.png",
    primaryColor: "#1C1C1C",
    secondaryColor: "#E53935",
    fontFamily: "Tajawal, sans-serif",
  },

  defaultLanguage: "ar",
  availableLanguages: ["ar","he"], // جميع اللغات متاحة (يمكن تعديلها حسب الحاجة)
  rtl: true,

  // ✅ البيانات الحساسة (supabaseUrl, supabaseKey, siteId, netlifyToken) 
  // سيتم تحميلها تلقائياً من ملف envs/zgayer.env
}, "zgayer"); // تمرير اسم العميل بشكل صريح

export default config;
