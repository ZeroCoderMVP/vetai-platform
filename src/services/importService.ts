import * as fs from "fs";
import * as path from "path";
import prisma from "@/lib/prisma";
import { parseAfimilkDirectory } from "./parsers/afimilk";
import { parseAICFile } from "./parsers/aic";
import {
  parseDTMExcel,
  parseSmartDTM,
  parseMixHistory,
  parseIngredientConsumption,
  parsePenHistory,
  parsePenEfficiency,
} from "./parsers/dtm";

const DATA_ROOT = process.env.VETAI_DATA_ROOT || "/data";

const DIRS = {
  inbox: path.join(DATA_ROOT, "inbox"),
  processed: path.join(DATA_ROOT, "processed"),
  error: path.join(DATA_ROOT, "error"),
};

const SOURCES = ["afimilk", "aic", "dtm"] as const;
type SourceName = (typeof SOURCES)[number];

/**
 * Инициализация каталогов обмена (INBOX/PROCESSED/ERROR)
 */
export function ensureDirectories() {
  for (const dir of Object.values(DIRS)) {
    for (const source of SOURCES) {
      const p = path.join(dir, source);
      if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
      }
    }
  }
}

function moveFile(filePath: string, destDir: string) {
  const filename = path.basename(filePath);
  const dest = path.join(destDir, filename);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.renameSync(filePath, dest);
}

async function getOrCreateSource(name: string, type: string = "file") {
  let source = await prisma.dataSource.findUnique({ where: { name } });
  if (!source) {
    source = await prisma.dataSource.create({
      data: { name, type, status: "active" },
    });
  }
  return source;
}

async function getOrCreateFarm() {
  let farm = await prisma.farm.findFirst();
  if (!farm) {
    farm = await prisma.farm.create({
      data: {
        name: "АО «Гатчинское»",
        location: "Ленинградская обл.",
      },
    });
  }
  return farm;
}

async function getOrCreateCow(farmId: string, cowNumber: string) {
  let cow = await prisma.cow.findFirst({
    where: { farmId, number: cowNumber },
  });
  if (!cow) {
    cow = await prisma.cow.create({
      data: { farmId, number: cowNumber, afiId: cowNumber, status: "active" },
    });
  }
  return cow;
}

// ==========================================
// Импорт Afimilk JSON — по одному файлу
// ==========================================
async function importAfimilkFile(filePath: string, farm: { id: string }) {
  const source = await getOrCreateSource("afimilk");
  const batch = await prisma.integrationBatch.create({
    data: {
      sourceId: source.id,
      source: "afimilk",
      filename: path.basename(filePath),
      status: "processing",
      startedAt: new Date(),
    },
  });

  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);
    let recordCount = 0;

    const reportName = data.reportName || data.Name || path.basename(filePath, ".json");
    const items = data.items || data.Table || [];

    if (Array.isArray(items)) {
      for (const row of items) {
        const cowNum = String(row.cow || row.AnimalNumber || row.CowNumber || "").replace(/^0+/, "");
        if (!cowNum || cowNum === "0" || cowNum === "") continue;

        const cow = await getOrCreateCow(farm.id, cowNum);

        const updateData: Record<string, any> = {};
        if (row.lactationNumber) updateData.lactation = row.lactationNumber;
        if (row.dim) updateData.dim = row.dim;
        if (Object.keys(updateData).length > 0) {
          await prisma.cow.update({ where: { id: cow.id }, data: updateData });
        }

        const severity =
          reportName.includes("Mastitis") || reportName.includes("Ketosis")
            ? "critical"
            : reportName.includes("Health") || reportName.includes("Suspected") || reportName.includes("Abortion")
            ? "warning"
            : "info";

        await prisma.event.create({
          data: {
            cowId: cow.id,
            farmId: farm.id,
            severity,
            title: `${reportName}: корова #${cowNum}`,
            description: JSON.stringify(row).substring(0, 500),
            timestamp: new Date(),
            source: "afimilk",
          },
        });

        recordCount++;
      }
    }

    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: { status: "completed", recordCount, recordsRead: recordCount, recordsInserted: recordCount, finishedAt: new Date(), processedAt: new Date() },
    });
    await prisma.dataSource.update({
      where: { id: source.id },
      data: { lastSync: new Date(), status: "active" },
    });

    return { success: true, recordCount };
  } catch (err: any) {
    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: { status: "error", errors: err.message, errorMessage: err.message, finishedAt: new Date(), processedAt: new Date() },
    });
    throw err;
  }
}

// ==========================================
// Импорт AIC (доение)
// ==========================================
async function importAICFile(filePath: string, farm: { id: string }) {
  const source = await getOrCreateSource("aic");
  const batch = await prisma.integrationBatch.create({
    data: {
      sourceId: source.id,
      source: "aic",
      filename: path.basename(filePath),
      status: "processing",
      startedAt: new Date(),
    },
  });

  try {
    const records = parseAICFile(filePath);
    let recordCount = 0;

    for (const r of records) {
      if (r.cowNumber === "0" || r.yield <= 0) continue;

      const cow = await getOrCreateCow(farm.id, r.cowNumber);

      const dateStr = r.date;
      const dateObj = new Date(
        `20${dateStr.substring(0, 2)}-${dateStr.substring(2, 4)}-${dateStr.substring(4, 6)}`
      );

      await prisma.milkRecord.upsert({
        where: {
          cowNumber_date_session_source: {
            cowNumber: r.cowNumber,
            date: dateObj,
            session: r.milkingNumber,
            source: "aic",
          },
        },
        update: {
          yield: r.yield,
          conductivity: r.conductivity,
          scc: r.scc,
          duration: r.duration,
          completeness: r.completeness,
          stall: String(r.stall),
        },
        create: {
          cowId: cow.id,
          cowNumber: r.cowNumber,
          date: dateObj,
          session: r.milkingNumber,
          yield: r.yield,
          conductivity: r.conductivity,
          scc: r.scc,
          duration: r.duration,
          completeness: r.completeness,
          stall: String(r.stall),
          source: "aic",
          batchId: batch.id,
        },
      });

      recordCount++;
    }

    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: { status: "completed", recordCount, recordsRead: recordCount, recordsInserted: recordCount, finishedAt: new Date(), processedAt: new Date() },
    });
    await prisma.dataSource.update({
      where: { id: source.id },
      data: { lastSync: new Date(), status: "active" },
    });

    return { success: true, recordCount };
  } catch (err: any) {
    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: { status: "error", errors: err.message, errorMessage: err.message, finishedAt: new Date(), processedAt: new Date() },
    });
    throw err;
  }
}

// ==========================================
// Импорт DTM Excel — умный маршрутизатор
// ==========================================
async function importDTMFile(filePath: string, farm: { id: string }) {
  const source = await getOrCreateSource("dtm");
  const batch = await prisma.integrationBatch.create({
    data: {
      sourceId: source.id,
      source: "dtm",
      filename: path.basename(filePath),
      status: "processing",
      startedAt: new Date(),
    },
  });

  try {
    const result = parseSmartDTM(filePath);
    let recordCount = 0;

    switch (result.type) {
      case "mix_history":
        if (result.mixHistory) {
          for (const row of result.mixHistory) {
            await (prisma as any).mixBatch.create({
              data: {
                dtmBatchId: row.dtmBatchId || null,
                recipeName: row.recipeName,
                groupCode: String(row.code) || null,
                headCount: row.headCount || null,
                date: new Date(row.date),
                startTime: row.startTime || null,
                endTime: row.endTime || null,
                loadDuration: row.loadDuration || null,
                mixDuration: row.mixDuration || null,
                mixer: row.mixer || null,
                pauseDuration: row.pauseDuration || null,
                totalDuration: row.totalDuration || null,
                source: "dtm",
                batchId: batch.id,
              },
            });
            recordCount++;
          }
        }
        break;

      case "ingredient_consumption":
        if (result.ingredientConsumption) {
          for (const row of result.ingredientConsumption) {
            await (prisma as any).ingredientConsumption.create({
              data: {
                ingredientCode: row.ingredientCode || null,
                ingredientName: row.ingredientName,
                targetWeight: row.targetWeight || null,
                indicatorWeight: row.indicatorWeight || null,
                actualWeight: row.actualWeight || null,
                loadedDM: row.loadedDM || null,
                errorPercent: row.errorPercent || null,
                errorAbsPercent: row.errorAbsPercent || null,
                totalConsumption: row.totalConsumption || null,
                date: new Date(row.date),
              },
            });
            recordCount++;
          }
        }
        break;

      case "pen_history":
        if (result.penHistory) {
          for (const row of result.penHistory) {
            await prisma.feedRecord.create({
              data: {
                groupName: row.groupCode,
                date: new Date(row.date),
                recipe: row.recipeName || null,
                planned: row.targetWeight || null,
                actual: row.actualWeight || null,
                remainder: null,
                dryMatter: null,
                headCount: row.headCount || null,
                corrPercent: row.corrPercent || null,
                targetWeight: row.indicatorWeight || null,
                feedingCount: row.feedingCount || null,
                source: "dtm",
                batchId: batch.id,
              },
            });
            recordCount++;
          }
        }
        break;

      case "pen_efficiency":
        if (result.penEfficiency) {
          for (const row of result.penEfficiency) {
            await prisma.feedRecord.create({
              data: {
                groupName: row.groupCode,
                date: new Date(row.date),
                recipe: row.recipeName || null,
                planned: null,
                actual: null,
                remainder: null,
                dryMatter: null,
                headCount: row.headCount || null,
                milkYield: row.milkYield || null,
                iofc: row.iofc || null,
                groupType: row.groupType || null,
                source: "dtm",
                batchId: batch.id,
              },
            });
            recordCount++;
          }
        }
        break;

      case "manual_weighings":
        if (result.manualWeighings) {
          for (const row of result.manualWeighings) {
            await prisma.feedRecord.create({
              data: {
                groupName: row.groupCode,
                date: new Date(row.date),
                remainder: row.weight || null,
                source: "dtm",
                batchId: batch.id,
              },
            });
            recordCount++;
          }
        }
        break;

      default:
        // Generic: используем старый парсер
        if (result.generic) {
          for (const row of result.generic.rows) {
            await prisma.feedRecord.create({
              data: {
                groupName: row.groupName,
                date: new Date(row.date),
                recipe: row.recipe,
                planned: row.planned,
                actual: row.actual,
                remainder: row.remainder,
                dryMatter: row.dryMatter,
                source: "dtm",
                batchId: batch.id,
              },
            });
            recordCount++;
          }
        }
        break;
    }

    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: { status: "completed", recordCount, recordsRead: recordCount, recordsInserted: recordCount, finishedAt: new Date(), processedAt: new Date() },
    });
    await prisma.dataSource.update({
      where: { id: source.id },
      data: { lastSync: new Date(), status: "active" },
    });

    return { success: true, recordCount, type: result.type };
  } catch (err: any) {
    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: { status: "error", errors: err.message, errorMessage: err.message, finishedAt: new Date(), processedAt: new Date() },
    });
    throw err;
  }
}

// ==========================================
// Главный метод — сканирование INBOX
// ==========================================
export async function runImport() {
  ensureDirectories();
  const farm = await getOrCreateFarm();
  const results: { source: string; file: string; status: string; type?: string; recordCount?: number; error?: string }[] = [];

  for (const sourceName of SOURCES) {
    const inboxDir = path.join(DIRS.inbox, sourceName);
    const processedDir = path.join(DIRS.processed, sourceName);
    const errorDir = path.join(DIRS.error, sourceName);

    if (!fs.existsSync(inboxDir)) continue;
    const files = fs.readdirSync(inboxDir).filter(f => !fs.statSync(path.join(inboxDir, f)).isDirectory());

    for (const file of files) {
      const filePath = path.join(inboxDir, file);

      try {
        let result: { success: boolean; recordCount: number; type?: string };

        switch (sourceName) {
          case "afimilk":
            result = await importAfimilkFile(filePath, farm);
            break;
          case "aic":
            result = await importAICFile(filePath, farm);
            break;
          case "dtm":
            result = await importDTMFile(filePath, farm);
            break;
          default:
            continue;
        }

        moveFile(filePath, processedDir);
        results.push({ source: sourceName, file, status: "completed", type: result.type, recordCount: result.recordCount });
      } catch (err: any) {
        moveFile(filePath, errorDir);
        results.push({ source: sourceName, file, status: "error", error: err.message });
      }
    }
  }

  return { results };
}

/**
 * Seed из существующих файлов
 */
export async function seedFromExistingData() {
  const farm = await getOrCreateFarm();

  // AFI JSON
  const afiDir = path.join(DIRS.inbox, "afimilk");
  if (fs.existsSync(afiDir)) {
    const afiFiles = fs.readdirSync(afiDir).filter(f => f.endsWith(".json"));
    for (const file of afiFiles) {
      try {
        await importAfimilkFile(path.join(afiDir, file), farm);
        console.log(`✅ AFI: ${file}`);
      } catch (err: any) {
        console.error(`❌ AFI: ${file} — ${err.message}`);
      }
    }
  }

  // AIC доение
  const aicDir = path.join(DIRS.inbox, "aic");
  if (fs.existsSync(aicDir)) {
    const aicFiles = fs.readdirSync(aicDir).filter(f => f.toUpperCase().endsWith(".AIC"));
    for (const file of aicFiles) {
      try {
        await importAICFile(path.join(aicDir, file), farm);
        console.log(`✅ AIC: ${file}`);
      } catch (err: any) {
        console.error(`❌ AIC: ${file} — ${err.message}`);
      }
    }
  }

  // DTM кормление — расширенный импорт
  const dtmDir = path.join(DIRS.inbox, "dtm");
  if (fs.existsSync(dtmDir)) {
    const dtmFiles = fs.readdirSync(dtmDir).filter(f => 
      f.endsWith(".xlsx") || f.endsWith(".xls")
    );
    for (const file of dtmFiles) {
      try {
        const result = await importDTMFile(path.join(dtmDir, file), farm);
        console.log(`✅ DTM [${result.type}]: ${file} — ${result.recordCount} записей`);
      } catch (err: any) {
        console.error(`❌ DTM: ${file} — ${err.message}`);
      }
    }
  }

  console.log("\n🎉 Seed завершен!");
}
