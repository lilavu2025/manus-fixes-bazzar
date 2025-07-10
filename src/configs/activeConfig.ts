import configMap from "./configMap";
import defaultConfig from "./defaultConfig";

// Check for client from URL parameters first
let clientKey = import.meta.env.VITE_CLIENT_KEY;

// If no environment variable, check URL parameters
if (!clientKey && typeof window !== 'undefined') {
  const urlParams = new URLSearchParams(window.location.search);
  clientKey = urlParams.get('client');
}

let config;
if (clientKey && configMap[clientKey]) {
  config = configMap[clientKey];
  console.log(`🎯 استخدام تكوين العميل: ${clientKey}`);
} else {
  config = defaultConfig;
  console.log(`🔄 استخدام التكوين الافتراضي`);
  if (!clientKey) {
    console.log(`💡 لتحديد عميل معين: npm run dev:client <client-name> أو إضافة ?client=<name> للرابط`);
  }
}

export default config;
