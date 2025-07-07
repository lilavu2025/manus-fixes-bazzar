// scripts/dev-default.ts
// لتشغيل dev مع التكوين الافتراضي
// npm run dev

import { execSync } from "child_process";
import { copyFileSync, existsSync } from "fs";
import { join } from "path";

const envSourcePath = join(process.cwd(), "envs", "default.env");
const envTargetPath = join(process.cwd(), ".env");

// التحقق من وجود ملف البيئة الافتراضي
if (!existsSync(envSourcePath)) {
  console.error(`❌ ملف البيئة الافتراضي غير موجود: envs/default.env`);
  process.exit(1);
}

// نسخ ملف البيئة الافتراضي إلى .env
try {
  copyFileSync(envSourcePath, envTargetPath);
  console.log(`✅ تم نسخ ملف البيئة الافتراضي: envs/default.env → .env`);
} catch (error) {
  console.error(`❌ فشل في نسخ ملف البيئة:`, error);
  process.exit(1);
}

console.log(`🚀 جاري تشغيل dev مع التكوين الافتراضي`);

try {
  execSync(`vite`, { stdio: "inherit" });
} catch (error) {
  console.error("❌ فشل في تشغيل dev:", error);
  process.exit(1);
}
