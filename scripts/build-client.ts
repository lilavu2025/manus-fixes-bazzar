// عن طريقه بعمل build للعميل المحدد
//npm run build:client <client_name>
// مثال: npm run build:client zgayer
// scripts/build-client.cjs

// scripts/build-client.cjs
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";
import { register } from "ts-node";

// ✅ فعّل ts-node لتشغيل ملفات TypeScript مباشرة
register({
  transpileOnly: true,
  compilerOptions: {
    module: "ESNext",
  },
});

const client = process.argv[2];
if (!client) {
  console.error("❌ لازم تحدد اسم العميل مثل: npm run build:client zgayer");
  process.exit(1);
}

const timestamp = new Date().toISOString();
const logFile = "logs/deploy.log";
const distPath = `dist-clients/${client}`;

function log(message) {
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

console.log(`🚀 بيبدأ البناء للعميل: ${client}`);
log(`🚀 بدأ البناء للعميل: ${client}`);

try {
  execSync(`cross-env VITE_CLIENT_KEY=${client} npm run build`, {
    stdio: "inherit",
  });
  log(`✅ البناء نجح للعميل: ${client}`);
} catch (err) {
  log(`❌ فشل البناء للعميل: ${client}`);
  process.exit(1);
}

// 🔥 استورد ملف الكونفج الخاص بالعميل
const configPath = pathToFileURL(path.resolve(`./src/configs/users-configs/${client}-store.ts`)).href;
const configModule = await import(configPath);
const config = configModule.default;

const token = config.deploy?.netlifyToken;
const siteId = config.deploy?.siteId;

if (!token || !siteId) {
  console.error("❌ مفقود التوكن أو siteId للعميل.");
  log(`❌ فشل النشر: توكن أو Site ID غير موجود`);
  process.exit(1);
}

console.log("⬆️ بيرفع النسخة إلى Netlify...");
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
  process.exit(1);
}
