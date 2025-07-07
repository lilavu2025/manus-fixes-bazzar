// scripts/build-default.ts
import { execSync } from "child_process";
import fs from "fs";
import fsExtra from "fs-extra";
import path from "path";
import { cleanupBackups } from "./cleanup-backups";

const timestamp = new Date().toLocaleString("sv-SE", {
  timeZone: "Asia/Jerusalem",
}).replace(/[: ]/g, "-");
const logFile = "logs/deploy.log";
const distPath = `dist`;
const backupPath = `backups/default/${timestamp}`;

// 🔧 تأكد من وجود مجلد logs
fs.mkdirSync("logs", { recursive: true });

function log(message: string) {
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

console.log(`\n-----------------------بداية بناء النسخة العامة------------------`);
log(`\n-----------------------بداية بناء النسخة العامة ${timestamp}------------------`);
log(`🚧 بدأ البناء`);

if (fs.existsSync(distPath)) {
  fsExtra.copySync(distPath, backupPath);
  log(`📦 نسخة احتياطية محفوظة في: ${backupPath}`);
}

try {
  execSync(`vite build`, { stdio: "inherit" });
  console.log("✅ تم البناء بنجاح.");
  log("✅ البناء تم بنجاح.");
} catch (err) {
  console.error("❌ فشل في عملية البناء.");
  log("❌ فشل في عملية البناء.");
  process.exit(1);
}

cleanupBackups();
log("🧹 تم تنظيف النسخ القديمة.");
log("------------------نهاية بناء النسخة العامة------------------\n");
console.log("🧹 تم تنظيف النسخ القديمة.");
