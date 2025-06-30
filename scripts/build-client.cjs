// عن طريقه بعمل build للعميل المحدد
const { execSync } = require("child_process");

const client = process.argv[2];
if (!client) {
  console.error("❌ لازم تحدد اسم العميل مثل: npm run build:client zgayer");
  process.exit(1);
}

console.log(`🚀 بيبدأ البناء للعميل: ${client}`);
execSync(`cross-env VITE_CLIENT_KEY=${client} npm run build`, { stdio: "inherit" });
