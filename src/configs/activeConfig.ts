import configMap from "./configMap";
import defaultConfig from "./defaultConfig";

const clientKey = import.meta.env.VITE_CLIENT_KEY;

let config;
if (clientKey && configMap[clientKey]) {
  config = configMap[clientKey];
  console.log(`🎯 استخدام تكوين العميل: ${clientKey}`);
} else {
  config = defaultConfig;
  console.log(`🔄 استخدام التكوين الافتراضي`);
  if (!clientKey) {
    console.log(`💡 لتحديد عميل معين: npm run dev:client <client-name>`);
  }
}

export default config;
