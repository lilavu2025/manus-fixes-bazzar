// src/configs/defaultConfig.ts
const defaultConfig = {
  appId: "com.mtgary.defaultStore",
  
  version: "1.0.0", // سيتم تحديثه تلقائياً من package.json

  names: {
    ar: "متجري الإلكتروني",
    en: "My E-Commerce",
    he: "החנות שלי",
  },

  descriptions: {
    ar: "أفضل المنتجات بأفضل الأسعار",
    en: "Top quality products at the best prices",
    he: "מוצרים איכותיים במחירים הכי טובים",
  },

  visual: {
    logo: "/logos/default.png",
    splashScreen: "/splash/default.png",
    primaryColor: "#2D3748",
    secondaryColor: "#4FD1C5",
    fontFamily: "sans-serif",
  },
  
  supabaseUrl: "https://gcjqjcuwsofzrgohwleg.supabase.co",
  supabaseKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjanFqY3V3c29menJnb2h3bGVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyMTU5NDYsImV4cCI6MjA2Mzc5MTk0Nn0.LXduYXTaCHMEf0RTr-rAcfIrYsp2R7NhgM_voHpc7dw",

  defaultLanguage: "ar",
  rtl: false,
};

export default defaultConfig;
