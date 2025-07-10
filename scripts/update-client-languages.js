#!/usr/bin/env node
// scripts/update-client-languages.js
// سكريبت لتحديث إعدادات اللغات للعملاء الموجودين

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const clientName = process.argv[2];
const languages = process.argv[3];

if (!clientName || !languages) {
  console.log('❌ الاستخدام: npm run update-client-languages <client-name> <languages>');
  console.log('الأمثلة:');
  console.log('  npm run update-client-languages zgayer "ar,he"');
  console.log('  npm run update-client-languages myclient "ar,en"');
  console.log('  npm run update-client-languages anotherclient "en"');
  process.exit(1);
}

const configPath = path.join(__dirname, '..', 'src', 'configs', 'users-configs', `${clientName}-store.ts`);

if (!fs.existsSync(configPath)) {
  console.log(`❌ ملف التكوين غير موجود: ${configPath}`);
  process.exit(1);
}

const languageList = languages.split(',').map(lang => lang.trim());
const availableLanguages = languageList.filter(lang => ['ar', 'en', 'he'].includes(lang));

if (availableLanguages.length === 0) {
  console.log('❌ لا توجد لغات صحيحة. اللغات المتاحة: ar, en, he');
  process.exit(1);
}

console.log(`🔄 تحديث إعدادات اللغات للعميل: ${clientName}`);
console.log(`🌐 اللغات المتاحة: ${availableLanguages.join(', ')}`);

try {
  let configContent = fs.readFileSync(configPath, 'utf-8');
  
  // البحث عن السطر الذي يحتوي على defaultLanguage
  const defaultLanguageRegex = /defaultLanguage:\s*"([^"]+)"/;
  const rtlRegex = /rtl:\s*(true|false)/;
  
  let defaultLanguage = availableLanguages.includes('ar') ? 'ar' : availableLanguages[0];
  let rtl = availableLanguages.includes('ar') || availableLanguages.includes('he');
  
  // تحديث أو إضافة availableLanguages
  if (configContent.includes('availableLanguages:')) {
    // تحديث الموجود
    configContent = configContent.replace(
      /availableLanguages:\s*\[([^\]]+)\]/,
      `availableLanguages: [${availableLanguages.map(lang => `"${lang}"`).join(', ')}]`
    );
  } else {
    // إضافة جديد
    configContent = configContent.replace(
      /defaultLanguage:\s*"([^"]+)"/,
      `defaultLanguage: "${defaultLanguage}",\n  availableLanguages: [${availableLanguages.map(lang => `"${lang}"`).join(', ')}]`
    );
  }
  
  // تحديث defaultLanguage
  configContent = configContent.replace(
    defaultLanguageRegex,
    `defaultLanguage: "${defaultLanguage}"`
  );
  
  // تحديث rtl
  configContent = configContent.replace(
    rtlRegex,
    `rtl: ${rtl}`
  );
  
  // حفظ الملف
  fs.writeFileSync(configPath, configContent);
  
  console.log('✅ تم تحديث ملف التكوين بنجاح!');
  console.log(`📝 اللغة الافتراضية: ${defaultLanguage}`);
  console.log(`📐 اتجاه النص: ${rtl ? 'RTL' : 'LTR'}`);
  console.log(`🔄 اللغات المتاحة: ${availableLanguages.join(', ')}`);
  
  console.log('\n🚀 لتجربة التغييرات:');
  console.log(`npm run dev:client ${clientName}`);
  
} catch (error) {
  console.error('❌ خطأ في تحديث الملف:', error.message);
  process.exit(1);
}
