import { configMap } from "./configMap";
import defaultConfig from "./defaultConfig";

let config = defaultConfig;

try {
  const domain =
    typeof window !== "undefined" ? window.location.hostname : "localhost";
  const subdomain = domain.split(".")[0];

  if (domain === "localhost" || domain === "127.0.0.1") {
    // اختر كونفيج التطوير (ممكن يكون من configMap أو ثابت)
    config = configMap["zgayer-store"] || defaultConfig;
  } else if (subdomain && subdomain in configMap) {
    config = configMap[subdomain] || defaultConfig;
  } else {
    console.warn("⚠️ لا يوجد كونفيج مطابق للدومين. يتم استخدام الديفولت.");
  }
} catch (err) {
  console.error("❌ خطأ أثناء تحميل الكونفيج، جاري استخدام الديفولت", err);
  config = defaultConfig;
}

export default config;
console.log("🧩 تم اختيار الكونفيج:", config.appId);
