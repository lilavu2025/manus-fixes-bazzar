// scripts/cleanupBackups.ts
import fs from "fs";
import path from "path";

export function cleanupBackups() {
  const backupsRoot = path.resolve("backups");

  if (!fs.existsSync(backupsRoot)) {
    console.warn(`🚫 المجلد مش موجود: ${backupsRoot}`);
    return;
  }

  const clients = fs.readdirSync(backupsRoot).filter(name =>
    fs.statSync(path.join(backupsRoot, name)).isDirectory()
  );

  for (const client of clients) {
    const clientDir = path.join(backupsRoot, client);
    const backupDirs = fs.readdirSync(clientDir)
      .map(name => ({
        name,
        fullPath: path.join(clientDir, name),
        stat: fs.statSync(path.join(clientDir, name)),
      }))
      .filter(item => item.stat.isDirectory())
      .sort((a, b) => b.name.localeCompare(a.name)); // الأحدث أولًا

    const toDelete = backupDirs.slice(2); // احتفظ بأحدث 2 فقط

    for (const dir of toDelete) {
      fs.rmSync(dir.fullPath, { recursive: true, force: true });
      console.log(`🗑️ حذف النسخة القديمة: ${client}/${dir.name}`);
    }
  }

  console.log("✅ تم تنظيف النسخ الاحتياطية بنجاح.");
}
