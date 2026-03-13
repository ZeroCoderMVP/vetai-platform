// Fixed DTM seeder with correct column mappings
// Run: node seed_dtm_direct.js

const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");
const XLSX = require("xlsx");

const DB_PATH = path.resolve(__dirname, "dev.db");
const DTM_DIR = path.resolve(__dirname, "..", "DTM");

console.log("DB:", DB_PATH);
console.log("DTM:", DTM_DIR);

if (!fs.existsSync(DB_PATH)) { console.error("DB not found!"); process.exit(1); }
if (!fs.existsSync(DTM_DIR)) { console.error("DTM dir not found!"); process.exit(1); }

const db = new Database(DB_PATH);

function cuid() {
  return "c" + Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
}

function parseDate(val) {
  if (!val) return new Date();
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(val).trim();
  const match = s.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}`);
  try { const d = new Date(s); if (!isNaN(d.getTime())) return d; } catch {}
  return new Date();
}

function toNum(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

// Clear old DTM data
console.log("\n🗑️  Clearing old DTM data...");
db.prepare("DELETE FROM IngredientConsumption").run();
db.prepare("DELETE FROM MixBatch WHERE source = 'dtm'").run();
db.prepare("DELETE FROM FeedRecord WHERE source = 'dtm'").run();
db.prepare("DELETE FROM IntegrationBatch").run();
console.log("   Cleared!");

// Get or create DataSource
let source = db.prepare("SELECT * FROM DataSource WHERE name = 'dtm'").get();
if (!source) {
  const id = cuid();
  db.prepare("INSERT INTO DataSource (id, name, type, status) VALUES (?, ?, ?, ?)").run(id, "dtm", "file", "active");
  source = { id };
}

const files = fs.readdirSync(DTM_DIR).filter(f => f.endsWith(".xlsx"));
console.log(`\n📁 ${files.length} DTM files`);

for (const file of files) {
  const filePath = path.join(DTM_DIR, file);
  const filenameLower = file.toLowerCase();
  const batchId = cuid();
  db.prepare("INSERT INTO IntegrationBatch (id, sourceId, filename, status, recordCount, createdAt) VALUES (?, ?, ?, ?, ?, ?)")
    .run(batchId, source.id, file, "processing", 0, new Date().toISOString());

  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(sheet, { defval: "" });
    let recordCount = 0;

    if (filenameLower.includes("замес") || filenameLower.includes("mix")) {
      // === История замеса → MixBatch ===
      console.log(`\n🔄 ${file} → MixBatch (${rawData.length} rows)`);
      const stmt = db.prepare(`
        INSERT INTO MixBatch (id, dtmBatchId, recipeName, groupCode, headCount, date, startTime, endTime, loadDuration, mixDuration, mixer, pauseDuration, totalDuration, source, batchId)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rawData) {
        const recipeName = String(row["Замес"] || "").trim();
        if (!recipeName) continue;
        stmt.run(
          cuid(),
          toNum(row["ID Замеса"]),
          recipeName,
          String(row["Код"] || ""),
          toNum(row["Группы #Корм"]) || toNum(row["Голов"]),
          parseDate(row["Дата"]).toISOString(),
          String(row["Время начала"] || ""),
          String(row["Время окончания"] || ""),
          String(row["Общее время загрузки"] || ""),
          String(row["Общее время разгрузки"] || ""),
          String(row["Кормо-смеситель"] || ""),
          String(row["Общее время паузы"] || row["Общее времени паузы"] || ""),
          String(row["Общее время"] || ""),
          "dtm",
          batchId
        );
        recordCount++;
      }

    } else if (filenameLower.includes("ingredient") || filenameLower.includes("потреблен")) {
      // === Потребление ингредиентов → IngredientConsumption ===
      // Note: Excel has typo "Ингридиент" (и instead of е)
      console.log(`\n🧪 ${file} → IngredientConsumption (${rawData.length} rows)`);
      const stmt = db.prepare(`
        INSERT INTO IngredientConsumption (id, ingredientCode, ingredientName, targetWeight, indicatorWeight, actualWeight, loadedDM, errorPercent, errorAbsPercent, totalConsumption, date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rawData) {
        // Try both spellings: "Ингредиент" and "Ингридиент"  
        const name = String(row["Ингридиент"] || row["Ингредиент"] || row["Ingredient"] || "").trim();
        if (!name || name === "0") continue;
        stmt.run(
          cuid(),
          String(row["Идентификатор ингредиента"] || row["Идентификатор ингредиент..."] || row["Идентификатор"] || ""),
          name,
          toNum(row["Целевой вес, кг"]),
          toNum(row["Целевой вес на Индикаторе, кг"]),
          toNum(row["Загружено, кг"]),
          toNum(row["Загруженное СВ, кг"]),
          toNum(row["Ошибка (%)"]),
          toNum(row["Погрешность в % от нагрузки (АБС)"]),
          toNum(row["Общая погрешность (АБС), кг"] || row["Общая потребность (АБ"] || row["Общая потребл"]),
          new Date().toISOString()
        );
        recordCount++;
      }

    } else if (filenameLower.includes("pen-history") || filenameLower.includes("история загон")) {
      // === История загонов → FeedRecord ===
      console.log(`\n🏠 ${file} → FeedRecord/pen-history (${rawData.length} rows)`);
      const stmt = db.prepare(`
        INSERT INTO FeedRecord (id, groupName, date, recipe, planned, actual, remainder, dryMatter, headCount, corrPercent, targetWeight, feedingCount, groupType, feedCostPerHead, source, batchId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rawData) {
        const groupCode = String(row["Код Технологической группы"] || row["Код"] || "").trim();
        if (!groupCode || groupCode === "0") continue;
        stmt.run(
          cuid(),
          groupCode,
          parseDate(row["Дата"]).toISOString(),
          String(row["Технологическая группа"] || ""),
          toNum(row["Целевой вес, кг"]),                           // planned
          toNum(row["Кормление, кг"]),                              // actual
          toNum(row["Несъеденный (Вес), кг"]),                      // remainder
          toNum(row["С.В Потребление, кг"]),                        // dryMatter
          toNum(row["Среднее количество коров #"]),                  // headCount
          toNum(row["Корр. %"]),                                    // corrPercent
          toNum(row["Целевой вес на Индикаторе, кг"]),              // targetWeight
          toNum(row["Ежедневное кормление"]),                       // feedingCount
          String(row["Тип технологической группы"] || ""),           // groupType
          toNum(row["Стоимость/ Корова, ₽"]),                       // feedCostPerHead
          "dtm",
          batchId,
          new Date().toISOString()
        );
        recordCount++;
      }

    } else if (filenameLower.includes("efficiency") || filenameLower.includes("эффективност")) {
      // === Эффективность загонов → FeedRecord ===
      console.log(`\n📊 ${file} → FeedRecord/pen-efficiency (${rawData.length} rows)`);
      const stmt = db.prepare(`
        INSERT INTO FeedRecord (id, groupName, date, recipe, headCount, milkYield, iofc, actual, dryMatter, remainder, feedCostPerHead, groupType, source, batchId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rawData) {
        const groupCode = String(row["Код Технологической группы"] || row["Код"] || "").trim();
        if (!groupCode || groupCode === "0") continue;
        stmt.run(
          cuid(),
          groupCode,
          parseDate(row["Дата"]).toISOString(),
          String(row["Название технологической группы"] || ""),
          toNum(row["Коровы #"]) || toNum(row["Коров #"]),                    // headCount
          toNum(row["Количество молока, Kg"]),                                 // milkYield
          toNum(row["IOFC, ₽"] || row["IOFC, Р"] || row["IOFC"]),            // iofc
          toNum(row["Общее количество кормления, Kg"]),                        // actual (total feeding)
          toNum(row["Общее количество подаваемого СВ, Kg"]),                   // dryMatter
          toNum(row["Общее количество несъеденного, Kg"]),                     // remainder
          toNum(row["Стоимость на корову, ₽"]),                                // feedCostPerHead  
          String(row["Тип технологической группы"] || ""),                      // groupType
          "dtm",
          batchId,
          new Date().toISOString()
        );
        recordCount++;
      }

    } else if (filenameLower.includes("manual") || filenameLower.includes("взвеш")) {
      // === Ручные взвешивания → FeedRecord ===
      console.log(`\n⚖️ ${file} → FeedRecord/manual (${rawData.length} rows)`);
      const stmt = db.prepare(`
        INSERT INTO FeedRecord (id, groupName, date, remainder, source, batchId, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const row of rawData) {
        // manual-weighings has: Дата, Время, Режим взвешивания, Вес Kg, Фидер, Машина
        const groupName = String(row["Машина"] || row["Фидер"] || row["Группа"] || row["Загон"] || "manual").trim();
        if (!groupName || groupName === "0") continue;
        stmt.run(
          cuid(),
          groupName,
          parseDate(row["Дата"]).toISOString(),
          toNum(row["Вес, Kg"] || row["Вес"] || row["Weight"]),
          "dtm",
          batchId,
          new Date().toISOString()
        );
        recordCount++;
      }
    }

    db.prepare("UPDATE IntegrationBatch SET status = 'completed', recordCount = ?, processedAt = ? WHERE id = ?")
      .run(recordCount, new Date().toISOString(), batchId);
    console.log(`   ✅ ${recordCount} records`);
  } catch (err) {
    console.error(`   ❌ ${err.message}`);
    db.prepare("UPDATE IntegrationBatch SET status = 'error', errors = ?, processedAt = ? WHERE id = ?")
      .run(err.message, new Date().toISOString(), batchId);
  }
}

db.prepare("UPDATE DataSource SET lastSync = ?, status = 'active' WHERE id = ?")
  .run(new Date().toISOString(), source.id);

// Final counts
const fc = db.prepare("SELECT COUNT(*) as cnt FROM FeedRecord").get().cnt;
const mc = db.prepare("SELECT COUNT(*) as cnt FROM MixBatch").get().cnt;
const ic = db.prepare("SELECT COUNT(*) as cnt FROM IngredientConsumption").get().cnt;

// Verify data is not null
const sample = db.prepare("SELECT groupName, planned, actual, remainder, dryMatter FROM FeedRecord WHERE planned IS NOT NULL LIMIT 3").all();
console.log(`\n🎉 Done! FeedRecord=${fc}, MixBatch=${mc}, Ingredients=${ic}`);
console.log("Sample:", JSON.stringify(sample));

db.close();
