// عن طريقه بعمل build للعميل المحدد
// عن طريق الامر : node scripts/build-client.cjs <client_name>

const fs = require("fs");
const path = require("path");

const client = process.argv[2];
if (!client) {
  console.error("❌ حدد اسم العميل: npm run build:client zgayer");
  process.exit(1);
}

const source = path.join(__dirname, `../.env.${client}`);
const destination = path.join(__dirname, "../.env");

if (!fs.existsSync(source)) {
  console.error(`❌ الملف .env.${client} مش موجود`);
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`✅ تم إنشاء .env من .env.${client}`);
