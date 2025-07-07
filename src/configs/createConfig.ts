// src/configs/createConfig.ts
import defaultConfig from "./defaultConfig";
import { loadEnvConfig } from "./loadEnvConfig";

function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };
  for (const key in source) {
    if (
      Object.prototype.hasOwnProperty.call(source, key) &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key]) &&
      source[key] !== null
    ) {
      output[key] = deepMerge((target as any)[key] || {}, (source as any)[key]);
    } else {
      (output as any)[key] = (source as any)[key];
    }
  }
  return output;
}

export default function createConfig<T>(customConfig: Partial<T>, clientName?: string): T {
  let envConfig = {};
  
  // تحميل المتغيرات من ملف .env إذا كان اسم العميل متاحاً
  if (clientName) {
    const env = loadEnvConfig(clientName);
    envConfig = {
      supabaseUrl: env.supabaseUrl,
      supabaseKey: env.supabaseKey,
      deploy: {
        siteId: env.siteId,
        netlifyToken: env.netlifyToken,
      }
    };
  }
  
  // دمج التكوين الافتراضي مع متغيرات البيئة ثم التكوين المخصص
  let mergedConfig = deepMerge(defaultConfig as T, envConfig as Partial<T>);
  mergedConfig = deepMerge(mergedConfig, customConfig);
  
  return mergedConfig;
}
