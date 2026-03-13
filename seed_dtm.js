// Seed DTM data into the database
// Run: node seed_dtm.js

const path = require("path");
const fs = require("fs");

async function main() {
  // Prisma v7 requires the better-sqlite3 adapter
  const dbPath = path.resolve(__dirname, "dev.db");
  
  const { PrismaClient } = require("./src/generated/prisma");
  const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
  const adapter = new PrismaBetterSqlite3({ url: dbPath });
  const prisma = new PrismaClient({ adapter });

  const XLSX = require("xlsx");

  const DTM_DIR = path.resolve(__dirname, "..", "DTM");
  console.log("📂 DTM directory:", DTM_DIR);

  if (!fs.existsSync(DTM_DIR)) {
    console.error("❌ DTM directory not found!");
    return;
  }

  // Get or create farm
  let farm = await prisma.farm.findFirst();
  if (!farm) {
    farm = await prisma.farm.create({
      data: { name: "АО «Гатчинское»", location: "Ленинградская обл." },
    });
  }

  // Get or create data source
  let source = await prisma.dataSource.findUnique({ where: { name: "dtm" } });
  if (!source) {
    source = await prisma.dataSource.create({
      data: { name: "dtm", type: "file", status: "active" },
    });
  }

  const files = fs.readdirSync(DTM_DIR).filter((f) => f.endsWith(".xlsx"));
  console.log(`📁 Found ${files.length} DTM files:`, files);

  for (const file of files) {
    const filePath = path.join(DTM_DIR, file);
    const filenameLower = file.toLowerCase();

    const batch = await prisma.integrationBatch.create({
      data: {
        sourceId: source.id,
        filename: file,
        status: "processing",
      },
    });

    try {
      const workbook = XLSX.readFile(filePath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json(sheet, { defval: 0 });
      let recordCount = 0;

      if (filenameLower.includes("замес") || filenameLower.includes("mix")) {
        // === История замеса ===
        console.log(`\n🔄 ${file} → MixBatch`);
        for (const row of rawData) {
          const recipeName = String(row["Замес"] || row["Recipe"] || "").trim();
          if (!recipeName) continue;

          const dateVal = row["Дата"] || row["Date"];
          const date = parseDate(dateVal);

          await prisma.mixBatch.create({
            data: {
              dtmBatchId: Number(row["ID Замеса"] || row["ID"] || 0) || null,
              recipeName,
              groupCode: String(row["Код"] || ""),
              headCount: Number(row["Голов"] || 0) || null,
              date,
              startTime: String(row["Время начала"] || ""),
              endTime: String(row["Время окончания"] || ""),
              loadDuration: String(row["Общее время загрузки"] || ""),
              mixDuration: String(row["Общее время разгрузки"] || ""),
              mixer: String(row["Кормо-смеситель"] || ""),
              pauseDuration: String(row["Общее времени паузы"] || ""),
              totalDuration: String(row["Общее время"] || ""),
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("ingredient") || filenameLower.includes("потреблен")) {
        // === Потребление ингредиентов ===
        console.log(`\n🧪 ${file} → IngredientConsumption`);
        for (const row of rawData) {
          const name = String(row["Ингредиент"] || row["Ingredient"] || "").trim();
          if (!name || name === "0") continue;

          await prisma.ingredientConsumption.create({
            data: {
              ingredientCode: String(row["Идентификатор ингредиент..."] || row["Идентификатор"] || ""),
              ingredientName: name,
              targetWeight: Number(row["Целевой вес, кг"] || 0) || null,
              indicatorWeight: Number(row["Целевой вес на Индикаторе, кг"] || 0) || null,
              actualWeight: Number(row["Загружено, кг"] || 0) || null,
              loadedDM: Number(row["Загруженное СВ, кг"] || 0) || null,
              errorPercent: Number(row["Ошибка (%)"] || 0) || null,
              errorAbsPercent: Number(row["Погрешность в % от нагрузки (АБС)"] || 0) || null,
              totalConsumption: Number(row["Общая потребность (АБ"] || row["Общая потребл"] || 0) || null,
              date: new Date(),
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("pen-history") || filenameLower.includes("история загон")) {
        // === История загонов ===
        console.log(`\n🏠 ${file} → FeedRecord (pen history)`);
        for (const row of rawData) {
          const groupCode = String(row["Код Технологической группы"] || row["Код"] || "").trim();
          if (!groupCode || groupCode === "0") continue;

          const dateVal = row["Дата"] || row["Date"];
          const date = parseDate(dateVal);

          await prisma.feedRecord.create({
            data: {
              groupName: groupCode,
              date,
              recipe: String(row["Технологическая группа"] || ""),
              planned: Number(row["Целевой вес, кг"] || 0) || null,
              actual: Number(row["Кормление, кг"] || 0) || null,
              targetWeight: Number(row["Целевой вес на Индикаторе, кг"] || 0) || null,
              headCount: Number(row["Среднее количество коров #"] || 0) || null,
              corrPercent: Number(row["Корр. %"] || 100) || null,
              feedingCount: Number(row["Ежедневное кормление"] || 0) || null,
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("efficiency") || filenameLower.includes("эффективност")) {
        // === Эффективность загонов ===
        console.log(`\n📊 ${file} → FeedRecord (pen efficiency)`);
        for (const row of rawData) {
          const groupCode = String(row["Код Технологической группы"] || row["Код"] || "").trim();
          if (!groupCode || groupCode === "0") continue;

          const dateVal = row["Дата"] || row["Date"];
          const date = parseDate(dateVal);

          await prisma.feedRecord.create({
            data: {
              groupName: groupCode,
              date,
              recipe: String(row["Название технологической группы"] || ""),
              headCount: Number(row["Коров #"] || 0) || null,
              milkYield: Number(row["Количество молока, Kg"] || 0) || null,
              iofc: Number(row["IOFC, Р"] || row["IOFC"] || 0) || null,
              groupType: String(row["Тип технологической группы"] || ""),
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("manual") || filenameLower.includes("взвеш")) {
        // === Ручные взвешивания ===
        console.log(`\n⚖️ ${file} → FeedRecord (manual weighings)`);
        for (const row of rawData) {
          const groupCode = String(row["Группа"] || row["Загон"] || "").trim();
          if (!groupCode || groupCode === "0") continue;

          const dateVal = row["Дата"] || row["Date"];
          const date = parseDate(dateVal);

          await prisma.feedRecord.create({
            data: {
              groupName: groupCode,
              date,
              remainder: Number(row["Вес"] || row["Weight"] || 0) || null,
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else {
        console.log(`\n⚙️ ${file} → FeedRecord (generic)`);
        // Generic fallback
        for (const row of rawData) {
          const groupName = String(row["Группа"] || row["Загон"] || row["Секция"] || "").trim();
          if (!groupName || groupName === "0") continue;

          await prisma.feedRecord.create({
            data: {
              groupName,
              date: new Date(),
              recipe: String(row["Рецепт"] || row["Recipe"] || ""),
              planned: Number(row["План"] || 0) || null,
              actual: Number(row["Факт"] || 0) || null,
              remainder: Number(row["Остаток"] || 0) || null,
              dryMatter: Number(row["СВ"] || 0) || null,
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      }

      await prisma.integrationBatch.update({
        where: { id: batch.id },
        data: { status: "completed", recordCount, processedAt: new Date() },
      });
      console.log(`   ✅ ${recordCount} records imported`);
    } catch (err) {
      console.error(`   ❌ Error:`, err.message);
      await prisma.integrationBatch.update({
        where: { id: batch.id },
        data: { status: "error", errors: err.message, processedAt: new Date() },
      });
    }
  }

  await prisma.dataSource.update({
    where: { id: source.id },
    data: { lastSync: new Date(), status: "active" },
  });

  // Summary
  const feedCount = await prisma.feedRecord.count();
  const mixCount = await prisma.mixBatch.count();
  const ingCount = await prisma.ingredientConsumption.count();
  console.log(`\n🎉 Seed complete!`);
  console.log(`   📋 FeedRecord: ${feedCount} records`);
  console.log(`   🔄 MixBatch: ${mixCount} records`);
  console.log(`   🧪 IngredientConsumption: ${ingCount} records`);

  await prisma.$disconnect();
}

function parseDate(val) {
  if (!val) return new Date();
  if (typeof val === "number") {
    // Excel serial date
    const XLSX = require("xlsx");
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(val).trim();
  // DD/MM/YYYY or DD.MM.YYYY  
  const match = s.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (match) return new Date(`${match[3]}-${match[2]}-${match[1]}`);
  
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d;
  } catch {}
  
  return new Date();
}

main().catch(console.error);
