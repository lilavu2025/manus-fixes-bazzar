// scripts/test-config.js
// سكريبت لاختبار نظام التكوين الجديد

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 اختبار نظام التكوين...\n');

// 1. التحقق من وجود ملفات .env
const envsDir = path.join(__dirname, '..', 'envs');
const envFiles = fs.readdirSync(envsDir).filter(file => file.endsWith('.env'));

console.log('📁 ملفات .env الموجودة:');
envFiles.forEach(file => {
  console.log(`  - ${file}`);
});

// 2. التحقق من وجود ملفات config
const configsDir = path.join(__dirname, '..', 'src', 'configs', 'users-configs');
const configFiles = fs.readdirSync(configsDir).filter(file => file.endsWith('.ts'));

console.log('\n⚙️ ملفات التكوين الموجودة:');
configFiles.forEach(file => {
  console.log(`  - ${file}`);
});

// 3. التحقق من التطابق
console.log('\n🔗 التحقق من التطابق:');
configFiles.forEach(configFile => {
  const clientName = configFile.replace('.ts', '').split('-')[0];
  const expectedEnvFile = `${clientName}.env`;
  
  if (envFiles.includes(expectedEnvFile)) {
    console.log(`  ✅ ${configFile} ← ${expectedEnvFile}`);
  } else {
    console.log(`  ❌ ${configFile} ← ${expectedEnvFile} (مفقود)`);
  }
});

console.log('\n✨ تم الانتهاء من الاختبار');
