// scripts/validate-project.js
// أداة للتحقق من صحة المشروع وجميع التكوينات

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔍 فحص شامل للمشروع...\n');

// 1. فحص ملفات التكوين
function validateConfigs() {
  console.log('📋 فحص ملفات التكوين:');
  
  const configsDir = path.join(__dirname, '..', 'src', 'configs', 'users-configs');
  
  if (!fs.existsSync(configsDir)) {
    console.log('❌ مجلد التكوينات غير موجود');
    return false;
  }
  
  const configFiles = fs.readdirSync(configsDir).filter(file => file.endsWith('.ts'));
  
  if (configFiles.length === 0) {
    console.log('⚠️  لا توجد ملفات تكوين');
    return false;
  }
  
  let allValid = true;
  
  configFiles.forEach(file => {
    const filePath = path.join(configsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // التحقق من وجود العناصر الأساسية
    const hasCreateConfig = content.includes('createConfig');
    const hasClientName = content.includes('}, "') || content.includes("}, '");
    const hasExport = content.includes('export default');
    
    if (hasCreateConfig && hasClientName && hasExport) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - مشكلة في التكوين`);
      allValid = false;
    }
  });
  
  return allValid;
}

// 2. فحص ملفات البيئة
function validateEnvFiles() {
  console.log('\n🔐 فحص ملفات البيئة:');
  
  const envsDir = path.join(__dirname, '..', 'envs');
  
  if (!fs.existsSync(envsDir)) {
    console.log('❌ مجلد البيئة غير موجود');
    return false;
  }
  
  const envFiles = fs.readdirSync(envsDir).filter(file => file.endsWith('.env'));
  
  if (envFiles.length === 0) {
    console.log('⚠️  لا توجد ملفات بيئة');
    return false;
  }
  
  let allValid = true;
  
  envFiles.forEach(file => {
    const filePath = path.join(envsDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const requiredVars = [
      'VITE_CLIENT_KEY',
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_KEY',
      'VITE_NETLIFY_SITE_ID',
      'VITE_NETLIFY_TOKEN'
    ];
    
    const foundVars = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, value] = trimmedLine.split('=', 2);
        if (key && value) {
          foundVars[key.trim()] = value.trim();
        }
      }
    }
    
    const missingVars = requiredVars.filter(varName => !foundVars[varName]);
    const placeholderVars = requiredVars.filter(varName => {
      const value = foundVars[varName];
      return value && (value.includes('your-') || value.includes('here'));
    });
    
    if (missingVars.length === 0 && placeholderVars.length === 0) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file}`);
      if (missingVars.length > 0) {
        console.log(`    مفقود: ${missingVars.join(', ')}`);
      }
      if (placeholderVars.length > 0) {
        console.log(`    قيم وهمية: ${placeholderVars.join(', ')}`);
      }
      allValid = false;
    }
  });
  
  return allValid;
}

// 3. فحص التطابق بين الملفات
function validateMatching() {
  console.log('\n🔗 فحص التطابق بين الملفات:');
  
  const configsDir = path.join(__dirname, '..', 'src', 'configs', 'users-configs');
  const envsDir = path.join(__dirname, '..', 'envs');
  
  const configFiles = fs.readdirSync(configsDir).filter(file => file.endsWith('.ts'));
  const envFiles = fs.readdirSync(envsDir).filter(file => file.endsWith('.env'));
  
  let allMatched = true;
  
  configFiles.forEach(configFile => {
    const clientName = configFile.replace('.ts', '').split('-')[0];
    const expectedEnvFile = `${clientName}.env`;
    
    if (envFiles.includes(expectedEnvFile)) {
      console.log(`  ✅ ${configFile} ↔ ${expectedEnvFile}`);
    } else {
      console.log(`  ❌ ${configFile} ↔ ${expectedEnvFile} (مفقود)`);
      allMatched = false;
    }
  });
  
  // البحث عن ملفات بيئة بدون تكوين
  envFiles.forEach(envFile => {
    const clientName = envFile.replace('.env', '');
    const expectedConfigFile = configFiles.find(file => file.startsWith(`${clientName}-`));
    
    if (!expectedConfigFile) {
      console.log(`  ⚠️  ${envFile} - لا يوجد ملف تكوين مطابق`);
    }
  });
  
  return allMatched;
}

// 4. فحص الملفات الأساسية
function validateCoreFiles() {
  console.log('\n🔧 فحص الملفات الأساسية:');
  
  const coreFiles = [
    'src/configs/createConfig.ts',
    'src/configs/loadEnvConfig.ts',
    'src/configs/defaultConfig.ts'
  ];
  
  let allExist = true;
  
  coreFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file}`);
    } else {
      console.log(`  ❌ ${file} - مفقود`);
      allExist = false;
    }
  });
  
  return allExist;
}

// 5. فحص أداء النظام
function validatePerformance() {
  console.log('\n⚡ فحص الأداء:');
  
  const configsDir = path.join(__dirname, '..', 'src', 'configs', 'users-configs');
  const envsDir = path.join(__dirname, '..', 'envs');
  
  const configCount = fs.readdirSync(configsDir).filter(file => file.endsWith('.ts')).length;
  const envCount = fs.readdirSync(envsDir).filter(file => file.endsWith('.env')).length;
  
  console.log(`  📊 عدد ملفات التكوين: ${configCount}`);
  console.log(`  📊 عدد ملفات البيئة: ${envCount}`);
  
  if (configCount > 50) {
    console.log('  ⚠️  عدد كبير من ملفات التكوين - قد يؤثر على الأداء');
  }
  
  return true;
}

// تشغيل جميع الفحوصات
async function runAllValidations() {
  const results = [
    validateCoreFiles(),
    validateConfigs(),
    validateEnvFiles(),
    validateMatching(),
    validatePerformance()
  ];
  
  console.log('\n📊 النتائج النهائية:');
  
  const allPassed = results.every(result => result);
  
  if (allPassed) {
    console.log('✅ جميع الفحوصات نجحت! المشروع جاهز للاستخدام.');
  } else {
    console.log('❌ بعض الفحوصات فشلت. يرجى مراجعة المشاكل المذكورة أعلاه.');
  }
  
  return allPassed;
}

// تشغيل الفحص
runAllValidations().then(success => {
  process.exit(success ? 0 : 1);
});
