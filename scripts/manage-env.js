// scripts/manage-env.js
// أداة لإدارة ملفات البيئة للعملاء

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// قراءة المعاملات من command line
const command = process.argv[2];
const clientName = process.argv[3];

const commands = {
  'list': listEnvFiles,
  'validate': validateEnvFile,
  'copy': copyEnvFile,
  'backup': backupEnvFile,
  'restore': restoreEnvFile,
  'help': showHelp
};

function showHelp() {
  console.log(`
🔧 أداة إدارة ملفات البيئة للعملاء

الاستخدام:
  npm run manage-env <command> [options]

الأوامر المتاحة:
  list                    - عرض جميع ملفات البيئة
  validate <client>       - التحقق من صحة ملف البيئة لعميل معين
  copy <from> <to>        - نسخ ملف بيئة من عميل إلى آخر
  backup <client>         - إنشاء نسخة احتياطية من ملف البيئة
  restore <client>        - استعادة ملف البيئة من النسخة الاحتياطية
  help                    - عرض هذه المساعدة

أمثلة:
  npm run manage-env list
  npm run manage-env validate zgayer
  npm run manage-env copy zgayer newclient
  npm run manage-env backup zgayer
  `);
}

function listEnvFiles() {
  console.log('📁 ملفات البيئة الموجودة:\n');
  
  const envsDir = path.join(__dirname, '..', 'envs');
  const files = fs.readdirSync(envsDir).filter(file => file.endsWith('.env'));
  
  files.forEach(file => {
    const filePath = path.join(envsDir, file);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(2) + ' KB';
    const modified = stats.mtime.toLocaleDateString('ar-EG');
    
    console.log(`  📄 ${file}`);
    console.log(`     الحجم: ${size}`);
    console.log(`     آخر تعديل: ${modified}`);
    console.log('');
  });
}

function validateEnvFile(client) {
  if (!client) {
    console.log('❌ يجب تحديد اسم العميل');
    return;
  }
  
  const envPath = path.join(__dirname, '..', 'envs', `${client}.env`);
  
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ملف البيئة غير موجود: ${client}.env`);
    return;
  }
  
  console.log(`🔍 التحقق من ملف البيئة: ${client}.env\n`);
  
  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  
  const requiredVars = [
    'VITE_CLIENT_KEY',
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_KEY',
    'VITE_NETLIFY_SITE_ID',
    'VITE_NETLIFY_TOKEN'
  ];
  
  const foundVars = {};
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, value] = trimmedLine.split('=', 2);
      if (key && value) {
        foundVars[key.trim()] = value.trim();
      }
    }
  }
  
  let isValid = true;
  
  for (const requiredVar of requiredVars) {
    if (foundVars[requiredVar]) {
      const value = foundVars[requiredVar];
      const isPlaceholder = value.includes('your-') || value.includes('here');
      
      if (isPlaceholder) {
        console.log(`⚠️  ${requiredVar}: قيمة وهمية (تحتاج إلى تحديث)`);
        isValid = false;
      } else {
        console.log(`✅ ${requiredVar}: موجود`);
      }
    } else {
      console.log(`❌ ${requiredVar}: مفقود`);
      isValid = false;
    }
  }
  
  console.log('\n' + (isValid ? '✅ ملف البيئة صحيح' : '❌ ملف البيئة يحتاج إلى تحديث'));
}

function copyEnvFile(from, to) {
  if (!from || !to) {
    console.log('❌ يجب تحديد العميل المصدر والهدف');
    console.log('الاستخدام: npm run manage-env copy <from> <to>');
    return;
  }
  
  const fromPath = path.join(__dirname, '..', 'envs', `${from}.env`);
  const toPath = path.join(__dirname, '..', 'envs', `${to}.env`);
  
  if (!fs.existsSync(fromPath)) {
    console.log(`❌ ملف البيئة المصدر غير موجود: ${from}.env`);
    return;
  }
  
  if (fs.existsSync(toPath)) {
    console.log(`⚠️  ملف البيئة الهدف موجود: ${to}.env`);
    console.log('هل تريد استبداله؟ (y/n)');
    // في بيئة حقيقية، يمكن استخدام readline للتفاعل
  }
  
  try {
    let content = fs.readFileSync(fromPath, 'utf-8');
    
    // استبدال VITE_CLIENT_KEY بالقيمة الجديدة
    content = content.replace(/VITE_CLIENT_KEY=.+/, `VITE_CLIENT_KEY=${to}`);
    
    fs.writeFileSync(toPath, content);
    console.log(`✅ تم نسخ ملف البيئة من ${from} إلى ${to}`);
    console.log(`⚠️  تأكد من تحديث القيم الخاصة بالعميل الجديد`);
  } catch (error) {
    console.log(`❌ خطأ في نسخ الملف: ${error.message}`);
  }
}

function backupEnvFile(client) {
  if (!client) {
    console.log('❌ يجب تحديد اسم العميل');
    return;
  }
  
  const envPath = path.join(__dirname, '..', 'envs', `${client}.env`);
  
  if (!fs.existsSync(envPath)) {
    console.log(`❌ ملف البيئة غير موجود: ${client}.env`);
    return;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(__dirname, '..', 'envs', `${client}.env.backup.${timestamp}`);
  
  try {
    fs.copyFileSync(envPath, backupPath);
    console.log(`✅ تم إنشاء نسخة احتياطية: ${path.basename(backupPath)}`);
  } catch (error) {
    console.log(`❌ خطأ في إنشاء النسخة الاحتياطية: ${error.message}`);
  }
}

function restoreEnvFile(client) {
  if (!client) {
    console.log('❌ يجب تحديد اسم العميل');
    return;
  }
  
  const envsDir = path.join(__dirname, '..', 'envs');
  const backupFiles = fs.readdirSync(envsDir)
    .filter(file => file.startsWith(`${client}.env.backup.`))
    .sort()
    .reverse();
  
  if (backupFiles.length === 0) {
    console.log(`❌ لم يتم العثور على نسخ احتياطية لـ ${client}`);
    return;
  }
  
  console.log(`🔄 النسخ الاحتياطية المتاحة لـ ${client}:`);
  backupFiles.forEach((file, index) => {
    const timestamp = file.split('.backup.')[1];
    const date = new Date(timestamp.replace(/-/g, ':')).toLocaleString('ar-EG');
    console.log(`  ${index + 1}. ${date}`);
  });
  
  // استخدام أحدث نسخة احتياطية
  const latestBackup = backupFiles[0];
  const backupPath = path.join(envsDir, latestBackup);
  const envPath = path.join(envsDir, `${client}.env`);
  
  try {
    fs.copyFileSync(backupPath, envPath);
    console.log(`✅ تم استعادة ملف البيئة من النسخة الاحتياطية الأحدث`);
  } catch (error) {
    console.log(`❌ خطأ في استعادة الملف: ${error.message}`);
  }
}

// تشغيل الأمر
if (command && commands[command]) {
  commands[command](clientName, process.argv[4]);
} else {
  console.log('❌ أمر غير صحيح');
  showHelp();
}
