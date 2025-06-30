// src/configs/zgayerStore.ts
import createConfig from "../createConfig";

// التعديلات الخاصة بالمتجر
const config = createConfig({
  appId: "com.mtgary.zgayerStore",

  names: {
    ar: "شركة زغير للقوالب",
    en: "ZGAYER DIES CO.",
    he: "זגייר מבלטים  בע\"מ",
  },

  descriptions: {
    ar: "شركة زغير للقوالب",
    en: "ZGAYER DIES CO. - Premium Dies",
    he: "זגייר מבלטים - איכות ומקצועיות",
  },

  visual: {
    logo: "/assets/logos/zgayerStore.png",
    splashScreen: "/assets/splash/zgayerStore.png",
    primaryColor: "#000000",
    secondaryColor: "#D4AF37",
    fontFamily: "Tajawal, sans-serif",
  },

  supabaseUrl: "https://gcjqjcuwsofzrgohwleg.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjanFqY3V3c29menJnb2h3bGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTU5NDYsImV4cCI6MjA2Mzc5MTk0Nn0.LXduYXTaCHMEf0RTr-rAcfIrYsp2R7NhgM_voHpc7dw",

  defaultLanguage: "ar",
  rtl: true,
});

export default config;
