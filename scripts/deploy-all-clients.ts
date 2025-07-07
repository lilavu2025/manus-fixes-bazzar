// عن طريقه بنشر جميع العملاء على Netlify
// npm run deploy:all-clients
// scripts/deploy-all-clients.ts

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { register } from "ts-node";
import configMap from "../src/configs/configMap";
import { config as dotenvConfig } from "dotenv";

// ✅ فعل ts-node لتشغيل TypeScript مباشرة
register({
  transpileOnly: true,
  compilerOptions: {
    module: "ESNext",
  },
});

const timestamp = new Date().toLocaleString("sv-SE", {
  timeZone: "Asia/Jerusalem",
}).replace(/[: ]/g, "-");

const logFile = "logs/deploy-all.log";

function log(message: string) {
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

const clients = Object.keys(configMap);
console.log("🚀 بيبدأ رفع جميع العملاء إلى Netlify...");
log("🚀--------- بدأ النشر لكل العملاء---------");

for (const client of clients) {
  try {
    // نسخ ملف البيئة الخاص بالعميل قبل النشر
    const envSourcePath = path.join(process.cwd(), "envs", `${client}.env`);
    const envTargetPath = path.join(process.cwd(), ".env");
    
    if (fs.existsSync(envSourcePath)) {
      fs.copyFileSync(envSourcePath, envTargetPath);
      log(`✅ تم نسخ ملف البيئة: envs/${client}.env → .env`);
      
      // تحميل متغيرات البيئة في Node.js
      dotenvConfig({ path: envTargetPath });
      log(`✅ تم تحميل متغيرات البيئة في Node.js`);
    }
    
    // قراءة القيم من متغيرات البيئة
    const token = process.env.VITE_NETLIFY_TOKEN;
    const siteId = process.env.VITE_NETLIFY_SITE_ID;

    if (!token || !siteId) {
      console.warn(`⚠️ العميل ${client} ما عنده siteId أو token في ملف البيئة`);
      log(`⚠️ تخطى العميل ${client} لعدم وجود بيانات النشر في envs/${client}.env`);
      continue;
    }

    const distPath = `dist-clients/${client}`;
    console.log(`⬆️ بيرفع ${client} إلى Netlify...`);
    execSync(`npx netlify deploy --prod --dir=${distPath} --auth=${token} --site=${siteId}`, {
      stdio: "inherit",
    });
    log(`✅ تم رفع ${client} بنجاح`);
  } catch (err) {
    console.error(`❌ فشل نشر العميل ${client}`);
    log(`❌ فشل نشر ${client}`);
  }
}

console.log("🏁 انتهى رفع جميع العملاء.");
log("🏁---------- انتهى النشر لجميع العملاء----------");
