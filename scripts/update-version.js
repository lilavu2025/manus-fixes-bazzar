// scripts/update-version.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const version = packageJson.version;

// تحديث defaultConfig.ts
const configPath = path.join(__dirname, '..', 'src', 'configs', 'defaultConfig.ts');
let configContent = fs.readFileSync(configPath, 'utf8');

// استبدال رقم الإصدار
configContent = configContent.replace(
  /version:\s*"[^"]*"/,
  `version: "${version}"`
);

// كتابة الملف المحدث
fs.writeFileSync(configPath, configContent, 'utf8');

console.log(`✅ تم تحديث رقم الإصدار إلى: ${version}`);
