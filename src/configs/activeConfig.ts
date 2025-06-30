// src/configs/activeConfig.ts
import defaultConfig from "./defaultConfig";

const clientKey = import.meta.env.VITE_CLIENT_KEY || "default";

let config = defaultConfig;

try {
  config = (await import(`./users-configs/${clientKey}-store`)).default;
} catch (err) {
  console.warn(`⚠️ لم يتم العثور على config للعميل ${clientKey}، سيتم استخدام الديفولت.`);
}

export default config;
