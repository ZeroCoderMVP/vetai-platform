// Run this script to apply the schema changes and generate Prisma client
// Usage: node run_migration.js

const { execSync } = require("child_process");
const path = require("path");

const platformDir = __dirname;

console.log("📦 Step 1: Prisma DB Push (apply schema to SQLite)...");
try {
  const out1 = execSync("npx prisma db push --accept-data-loss", {
    cwd: platformDir,
    encoding: "utf-8",
    timeout: 120000,
    stdio: "pipe",
  });
  console.log(out1);
  console.log("✅ DB Push completed!");
} catch (e) {
  console.error("❌ DB Push failed:", e.message);
  if (e.stdout) console.log(e.stdout);
  if (e.stderr) console.log(e.stderr);
}

console.log("\n📦 Step 2: Prisma Generate...");
try {
  const out2 = execSync("npx prisma generate", {
    cwd: platformDir,
    encoding: "utf-8",
    timeout: 120000,
    stdio: "pipe",
  });
  console.log(out2);
  console.log("✅ Generate completed!");
} catch (e) {
  console.error("❌ Generate failed:", e.message);
  if (e.stdout) console.log(e.stdout);
  if (e.stderr) console.log(e.stderr);
}

console.log("\n🎉 Migration complete! Now run: npm run dev");
