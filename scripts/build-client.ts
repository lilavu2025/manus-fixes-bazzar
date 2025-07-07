// عن طريقه بعمل build للعميل المحدد
// وبتم رفعه على Netlify للعميل المحدد
//npm run build:client <client_name>
// مثال: npm run build:client zgayer
// scripts/build-client.ts

import { execSync } from "child_process";
import fs from "fs";
import fsExtra from "fs-extra";
import path from "path";
import { pathToFileURL } from "url";
import { register } from "ts-node";
import { cleanupBackups } from "./cleanup-backups";
import { config as dotenvConfig } from "dotenv";

// ✅ فعّل ts-node لتشغيل ملفات TypeScript مباشرة
register({
  transpileOnly: true,
  compilerOptions: { module: "ESNext" },
});

const client = process.argv[2];
if (!client) {
  console.error("❌ لازم تحدد اسم العميل مثل: npm run build:client zgayer");
  process.exit(1);
}

const timestamp = new Date().toLocaleString("sv-SE", {
  timeZone: "Asia/Jerusalem",
}).replace(/[: ]/g, "-");

const logFile = "logs/deploy.log";
const distPath = `dist-clients/${client}`;
const backupPath = `backups/${client}/${timestamp}`;

function log(message: string) {
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

console.log(`\n-----------------------بداية بناء ${client}------------------\n`);
log(`\n-----------------------بداية بناء ${client}------------------\n`);

if (fs.existsSync(distPath)) {
  fsExtra.copySync(distPath, backupPath);
  log(`📦 تم أخذ نسخة احتياطية من مجلد البناء إلى: ${backupPath}`);
}

console.log(`🚀 بيبدأ البناء للعميل: ${client}`);
log(`🚀 بدأ البناء للعميل: ${client}`);

try {
  // نسخ ملف البيئة الخاص بالعميل قبل البناء
  const envSourcePath = path.join(process.cwd(), "envs", `${client}.env`);
  const envTargetPath = path.join(process.cwd(), ".env");
  
  if (fs.existsSync(envSourcePath)) {
    fs.copyFileSync(envSourcePath, envTargetPath);
    log(`✅ تم نسخ ملف البيئة: envs/${client}.env → .env`);
    
    // تحميل متغيرات البيئة في Node.js
    dotenvConfig({ path: envTargetPath });
    log(`✅ تم تحميل متغيرات البيئة في Node.js`);
  }
  
  execSync(`cross-env VITE_CLIENT_KEY=${client} npm run build`, {
    stdio: "inherit",
  });
  log(`✅ البناء نجح للعميل: ${client}`);
} catch (err) {
  log(`❌ فشل البناء للعميل: ${client}`);
  process.exit(1);
}

// 🔥 حذف النسخ الاحتياطية القديمة وخلي اخر 2
cleanupBackups();
console.log("🧹 تم تنظيف النسخ الاحتياطية لكل العملاء بعد البناء.");

// 🔥 استورد ملف الكونفج الخاص بالعميل
const configPath = pathToFileURL(path.resolve(`./src/configs/users-configs/${client}-store.ts`)).href;
const configModule = await import(configPath);
const config = configModule.default;

// قراءة القيم من متغيرات البيئة (التي تم نسخها للتو)
const token = process.env.VITE_NETLIFY_TOKEN;
const siteId = process.env.VITE_NETLIFY_SITE_ID;

if (!token || !siteId) {
  console.error("❌ مفقود التوكن أو siteId للعميل في ملف البيئة.");
  log(`❌ فشل النشر: توكن أو Site ID غير موجود في envs/${client}.env`);
  process.exit(1);
}

console.log("⬆️ بيرفع النسخة إلى Netlify...");
log("⬆️ بيرفع النسخة إلى Netlify...");
try {
  execSync(
    `npx netlify deploy --prod --dir=${distPath} --auth=${token} --site=${siteId}`,
    { stdio: "inherit" }
  );
  console.log(`✅ البناء والرفع للعميل ${client} اكتمل بنجاح!`);
  log(`✅ النشر على Netlify تم بنجاح للعميل: ${client}`);
} catch (err) {
  console.error("❌ فشل النشر على Netlify.");
  log(`❌ فشل النشر للعميل ${client}`);
  console.log(`\n-----------------------نهاية بناء ${client}------------------\n`);
  log(`\n-----------------------نهاية بناء ${client}------------------\n`);
  process.exit(1);
}
