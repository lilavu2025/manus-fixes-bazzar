// عن طريقه بنشر جميع العملاء على Netlify
// npm run deploy:all-clients
// scripts/deploy-all-clients.ts

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { register } from "ts-node";
import configMap from "../src/configs/configMap";

// ✅ فعل ts-node لتشغيل TypeScript مباشرة
register({
  transpileOnly: true,
  compilerOptions: {
    module: "ESNext",
  },
});

const timestamp = new Date().toISOString();
const logFile = "logs/deploy-all.log";

function log(message: string) {
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

const clients = Object.keys(configMap);
console.log("🚀 بيبدأ رفع جميع العملاء إلى Netlify...");
log("🚀--------- بدأ النشر لكل العملاء---------");

for (const client of clients) {
  try {
    const configPath = pathToFileURL(path.resolve(`./src/configs/users-configs/${client}-store.ts`)).href;
    const configModule = await import(configPath);
    const config = configModule.default;

    const token = config.deploy?.netlifyToken;
    const siteId = config.deploy?.siteId;

    if (!token || !siteId) {
      console.warn(`⚠️ العميل ${client} ما عنده siteId أو token`);
      log(`⚠️ تخطى العميل ${client} لعدم وجود بيانات النشر`);
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
