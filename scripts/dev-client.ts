// scripts/dev-client.ts
// لتشغيل dev للعميل المحدد
// npm run dev:client zgayer

import { execSync } from "child_process";
import { copyFileSync, existsSync } from "fs";
import { join } from "path";

const clientKey = process.argv[2];

if (!clientKey) {
  console.error("❌ لازم تمرر اسم العميل هيك: npm run dev:client zgayer");
  process.exit(1);
}

const envSourcePath = join(process.cwd(), "envs", `${clientKey}.env`);
const envTargetPath = join(process.cwd(), ".env");

// التحقق من وجود ملف البيئة
if (!existsSync(envSourcePath)) {
  console.error(`❌ ملف البيئة غير موجود: envs/${clientKey}.env`);
  console.error(`💡 أنشئ الملف أولاً: npm run create-client ${clientKey} "Store Name"`);
  process.exit(1);
}

// نسخ ملف البيئة إلى .env
try {
  copyFileSync(envSourcePath, envTargetPath);
  console.log(`✅ تم نسخ ملف البيئة: envs/${clientKey}.env → .env`);
} catch (error) {
  console.error(`❌ فشل في نسخ ملف البيئة:`, error);
  process.exit(1);
}

console.log(`🚀 جاري تشغيل dev للعميل: ${clientKey}`);

try {
  execSync(`cross-env VITE_CLIENT_KEY=${clientKey} vite`, { stdio: "inherit" });
} catch (error) {
  console.error("❌ فشل في تشغيل dev:", error);
  process.exit(1);
}
