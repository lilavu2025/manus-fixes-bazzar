// scripts/dev-client.ts
// لتشغيل dev للعميل المحدد
// npm run dev:client zgayer

import { execSync } from "child_process";

const clientKey = process.argv[2];

if (!clientKey) {
  console.error("❌ لازم تمرر اسم العميل هيك: npm run dev:client zgayer");
  process.exit(1);
}

console.log(`🚀 جاري تشغيل dev للعميل: ${clientKey}`);

try {
  execSync(`cross-env VITE_CLIENT_KEY=${clientKey} vite`, { stdio: "inherit" });
} catch (error) {
  console.error("❌ فشل في تشغيل dev:", error);
  process.exit(1);
}
