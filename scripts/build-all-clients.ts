// عن طريقه بعمل build لكل العملاء
// مثال: npm run build:all-clients

// scripts/build-all-clients.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { register } from "ts-node";
import { pathToFileURL } from "url";

// ✅ فعّل ts-node لتشغيل TypeScript داخل هذا الملف
register({
  transpileOnly: true,
  compilerOptions: { module: "ESNext" },
});

const timestamp = new Date().toISOString();
const logFile = "logs/deploy.log";

function log(message) {
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

const configsDir = path.resolve("src/configs/users-configs");
const files = fs.readdirSync(configsDir);
const clients = files
  .filter((file) => file.endsWith("-store.ts"))
  .map((file) => file.replace("-store.ts", ""));

for (const client of clients) {
  console.log(`\n-----------------------بداية بناء ${client}------------------`);
  log(`\n-----------------------بداية بناء كل العملاء------------------`);
  console.log(`\n🚧 بناء عميل: ${client}`);
  log(`\n🚧 بناء عميل: ${client}`);
  try {
    execSync(`cross-env VITE_CLIENT_KEY=${client} npm run build`, {
      stdio: "inherit",
    });
    console.log(`✅ تم بناء ${client} بنجاح.`);
    log(`✅ تم بناء ${client} بنجاح.`);
  } catch (err) {
    console.error(`❌ فشل بناء ${client}`);
    log(`❌ فشل بناء ${client}`);
  }
  log(`\n-----------------------نهاية بناء كل العملاء------------------\n`);
}
