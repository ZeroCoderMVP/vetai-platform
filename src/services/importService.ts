import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import prisma from "@/lib/prisma";
import { getDataRoot } from "@/lib/runtime-paths";
import { parseAICFile } from "./parsers/aic";
import { parseSmartDTM } from "./parsers/dtm";
import { parseDayMilkDat } from "./parsers/dayMilk";

const DATA_ROOT = getDataRoot();

const DIRS = {
  inbox: path.join(DATA_ROOT, "inbox"),
  processed: path.join(DATA_ROOT, "processed"),
  error: path.join(DATA_ROOT, "error"),
};

const SOURCES = ["afimilk", "dtm", "aic"] as const;
type SourceName = (typeof SOURCES)[number];

type ImportStats = {
  recordsRead: number;
  recordsInserted: number;
  recordsUpdated: number;
  recordsSkipped: number;
};

type SourceImportResult = ImportStats & {
  type?: string;
};

class ImportFileError extends Error {
  stats: ImportStats;

  constructor(message: string, stats?: Partial<ImportStats>) {
    super(message);
    this.name = "ImportFileError";
    this.stats = {
      recordsRead: stats?.recordsRead ?? 0,
      recordsInserted: stats?.recordsInserted ?? 0,
      recordsUpdated: stats?.recordsUpdated ?? 0,
      recordsSkipped: stats?.recordsSkipped ?? 0,
    };
  }
}

export function ensureDirectories() {
  for (const dir of Object.values(DIRS)) {
    for (const source of SOURCES) {
      const sourceDir = path.join(dir, source);
      if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir, { recursive: true });
      }
    }
  }
}

function buildDestinationPath(destDir: string, filename: string): string {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const parsed = path.parse(filename);
  let candidate = path.join(destDir, filename);
  let suffix = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(destDir, `${parsed.name}_${suffix}${parsed.ext}`);
    suffix += 1;
  }

  return candidate;
}

function moveFile(filePath: string, destDir: string) {
  const destination = buildDestinationPath(destDir, path.basename(filePath));
  fs.renameSync(filePath, destination);
}

function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

function isAfimilkDayMilkFile(filePath: string) {
  return path.basename(filePath).toUpperCase() === "DAY_MILK.DAT";
}

function getUnsupportedFileMessage(sourceName: SourceName, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  switch (sourceName) {
    case "afimilk":
      if (ext === ".m00") {
        return "unsupported binary format for now";
      }
      return `Unsupported AFI file format '${ext || "<no extension>"}'. Supported: .json, DAY_MILK.DAT.`;
    case "aic":
      return `Unsupported AIC file format '${ext || "<no extension>"}'. Only .aic files are imported.`;
    case "dtm":
      return `Unsupported DTM file format '${ext || "<no extension>"}'. Supported: .xlsx, .xls, .csv.`;
  }
}

function isSupportedFile(sourceName: SourceName, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();

  switch (sourceName) {
    case "afimilk":
      return ext === ".json" || isAfimilkDayMilkFile(filePath);
    case "aic":
      return ext === ".aic";
    case "dtm":
      return ext === ".xlsx" || ext === ".xls" || ext === ".csv";
  }
}

async function getOrCreateSource(name: SourceName) {
  const existing = await prisma.dataSource.findUnique({ where: { name } });
  if (existing) return existing;

  return prisma.dataSource.create({
    data: { name, type: "file", status: "active" },
  });
}

async function getOrCreateFarm() {
  const existing = await prisma.farm.findFirst();
  if (existing) return existing;

  return prisma.farm.create({
    data: {
      name: "АО «Гатчинское»",
      location: "Ленинградская обл.",
    },
  });
}

async function getOrCreateCow(farmId: string, cowNumber: string) {
  const existing = await prisma.cow.findFirst({ where: { farmId, number: cowNumber } });
  if (existing) return existing;

  return prisma.cow.create({
    data: {
      farmId,
      number: cowNumber,
      afiId: cowNumber,
      status: "active",
    },
  });
}

function parseDateYYMMDD(raw: string): Date {
  if (!/^\d{6}$/.test(raw)) {
    throw new Error(`Некорректный формат даты AIC: ${raw}`);
  }

  const year = Number(`20${raw.slice(0, 2)}`);
  const month = Number(raw.slice(2, 4));
  const day = Number(raw.slice(4, 6));

  return new Date(year, month - 1, day);
}

function normalizeCowNumber(value: unknown): string {
  const normalized = String(value ?? "").replace(/^0+/, "").trim();
  return normalized === "" ? "0" : normalized;
}

async function createBatch(sourceName: SourceName, filePath: string, fileHash: string) {
  const source = await getOrCreateSource(sourceName);

  return prisma.integrationBatch.create({
    data: {
      sourceId: source.id,
      source: sourceName,
      filename: path.basename(filePath),
      fileHash,
      status: "processing",
      startedAt: new Date(),
    },
  });
}

async function completeBatch(batchId: string, stats: ImportStats) {
  await prisma.integrationBatch.update({
    where: { id: batchId },
    data: {
      status: "completed",
      recordsRead: stats.recordsRead,
      recordsInserted: stats.recordsInserted,
      recordsUpdated: stats.recordsUpdated,
      recordsSkipped: stats.recordsSkipped,
      recordCount: stats.recordsRead,
      finishedAt: new Date(),
      processedAt: new Date(),
      errorMessage: null,
      errors: null,
    },
  });
}

async function failBatch(batchId: string, errorMessage: string, stats: ImportStats) {
  await prisma.integrationBatch.update({
    where: { id: batchId },
    data: {
      status: "error",
      recordsRead: stats.recordsRead,
      recordsInserted: stats.recordsInserted,
      recordsUpdated: stats.recordsUpdated,
      recordsSkipped: stats.recordsSkipped,
      recordCount: stats.recordsRead,
      errorMessage,
      errors: errorMessage,
      finishedAt: new Date(),
      processedAt: new Date(),
    },
  });
}

async function markSourceSynced(sourceName: SourceName) {
  const source = await getOrCreateSource(sourceName);
  await prisma.dataSource.update({
    where: { id: source.id },
    data: { lastSync: new Date(), status: "active" },
  });
}

async function importAfimilkFile(filePath: string, farm: { id: string }, batchId: string): Promise<SourceImportResult> {
  const stats: ImportStats = {
    recordsRead: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  let data: any;
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    data = JSON.parse(content);
  } catch (error: any) {
    throw new ImportFileError(
      `Failed to parse AFI JSON '${path.basename(filePath)}': ${error instanceof Error ? error.message : String(error)}`,
      stats,
    );
  }
  const reportName = data.reportName || data.Name || path.basename(filePath, path.extname(filePath));
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data.Table) ? data.Table : [];

  for (const row of items) {
    stats.recordsRead += 1;

    const cowNum = normalizeCowNumber(row.cow || row.AnimalNumber || row.CowNumber);
    if (cowNum === "0") {
      stats.recordsSkipped += 1;
      continue;
    }

    const cow = await getOrCreateCow(farm.id, cowNum);

    const updateData: Record<string, number> = {};
    if (typeof row.lactationNumber === "number") updateData.lactation = row.lactationNumber;
    if (typeof row.dim === "number") updateData.dim = row.dim;

    if (Object.keys(updateData).length > 0) {
      await prisma.cow.update({ where: { id: cow.id }, data: updateData });
      stats.recordsUpdated += 1;
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
        description: JSON.stringify(row).slice(0, 1000),
        timestamp: new Date(),
        source: "afimilk",
      },
    });
    stats.recordsInserted += 1;
  }

  await prisma.integrationBatch.update({
    where: { id: batchId },
    data: {
      recordsRead: stats.recordsRead,
      recordsInserted: stats.recordsInserted,
      recordsUpdated: stats.recordsUpdated,
      recordsSkipped: stats.recordsSkipped,
      recordCount: stats.recordsRead,
    },
  });

  return stats;
}


async function importAfimilkDayMilkFile(filePath: string, farm: { id: string }, batchId: string): Promise<SourceImportResult> {
  const stats: ImportStats = {
    recordsRead: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  const content = fs.readFileSync(filePath, "utf-8");
  const parsed = parseDayMilkDat(content);

  stats.recordsRead = parsed.rowsRead;
  stats.recordsSkipped = parsed.rowsSkipped;

  for (const row of parsed.records) {
    const avg10Total = row.avg10Session1 + row.avg10Session2 + row.avg10Session3;
    const actualTotal = row.actualSession1 + row.actualSession2 + row.actualSession3;

    const cow = await prisma.cow.findFirst({
      where: { farmId: farm.id, number: row.cowNumber },
      select: { id: true },
    });

    const existing = await prisma.afimilkDayMilk.findUnique({
      where: {
        farmId_cowNumber_date: {
          farmId: farm.id,
          cowNumber: row.cowNumber,
          date: row.date,
        },
      },
      select: { id: true },
    });

    await prisma.afimilkDayMilk.upsert({
      where: {
        farmId_cowNumber_date: {
          farmId: farm.id,
          cowNumber: row.cowNumber,
          date: row.date,
        },
      },
      update: {
        cowId: cow?.id ?? null,
        avg10Session1: row.avg10Session1,
        actualSession1: row.actualSession1,
        avg10Session2: row.avg10Session2,
        actualSession2: row.actualSession2,
        avg10Session3: row.avg10Session3,
        actualSession3: row.actualSession3,
        avg10Total,
        actualTotal,
        batchId,
        sourceFile: path.basename(filePath),
      },
      create: {
        farmId: farm.id,
        cowId: cow?.id ?? null,
        cowNumber: row.cowNumber,
        date: row.date,
        avg10Session1: row.avg10Session1,
        actualSession1: row.actualSession1,
        avg10Session2: row.avg10Session2,
        actualSession2: row.actualSession2,
        avg10Session3: row.avg10Session3,
        actualSession3: row.actualSession3,
        avg10Total,
        actualTotal,
        batchId,
        sourceFile: path.basename(filePath),
      },
    });

    if (existing) stats.recordsUpdated += 1;
    else stats.recordsInserted += 1;
  }

  return stats;
}

async function importAicFile(filePath: string, farm: { id: string }, batchId: string): Promise<SourceImportResult> {
  const stats: ImportStats = {
    recordsRead: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  const records = parseAICFile(filePath);

  for (const record of records) {
    stats.recordsRead += 1;

    if (record.cowNumber === "0" || record.yield <= 0) {
      stats.recordsSkipped += 1;
      continue;
    }

    const cow = await getOrCreateCow(farm.id, record.cowNumber);
    const milkingDate = parseDateYYMMDD(record.date);

    const existing = await prisma.milkRecord.findUnique({
      where: {
        cowNumber_date_session_source: {
          cowNumber: record.cowNumber,
          date: milkingDate,
          session: record.milkingNumber,
          source: "aic",
        },
      },
      select: { id: true },
    });

    await prisma.milkRecord.upsert({
      where: {
        cowNumber_date_session_source: {
          cowNumber: record.cowNumber,
          date: milkingDate,
          session: record.milkingNumber,
          source: "aic",
        },
      },
      update: {
        yield: record.yield,
        conductivity: record.conductivity,
        scc: record.scc,
        duration: record.duration,
        completeness: record.completeness,
        stall: String(record.stall),
        batchId,
      },
      create: {
        cowId: cow.id,
        cowNumber: record.cowNumber,
        date: milkingDate,
        session: record.milkingNumber,
        yield: record.yield,
        conductivity: record.conductivity,
        scc: record.scc,
        duration: record.duration,
        completeness: record.completeness,
        stall: String(record.stall),
        source: "aic",
        batchId,
      },
    });

    if (existing) stats.recordsUpdated += 1;
    else stats.recordsInserted += 1;
  }

  return stats;
}

async function importDtmFile(filePath: string, batchId: string): Promise<SourceImportResult> {
  const stats: ImportStats = {
    recordsRead: 0,
    recordsInserted: 0,
    recordsUpdated: 0,
    recordsSkipped: 0,
  };

  const parsed = parseSmartDTM(filePath);

  switch (parsed.type) {
    case "mix_history":
      if (parsed.mixHistory) {
        for (const row of parsed.mixHistory) {
          stats.recordsRead += 1;
          await (prisma as any).mixBatch.create({
            data: {
              dtmBatchId: row.dtmBatchId || null,
              recipeName: row.recipeName,
              groupCode: row.code ? String(row.code) : null,
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
              batchId,
            },
          });
          stats.recordsInserted += 1;
        }
      }
      break;

    case "ingredient_consumption":
      if (parsed.ingredientConsumption) {
        for (const row of parsed.ingredientConsumption) {
          stats.recordsRead += 1;
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
          stats.recordsInserted += 1;
        }
      }
      break;

    case "pen_history":
      if (parsed.penHistory) {
        for (const row of parsed.penHistory) {
          stats.recordsRead += 1;
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
              batchId,
            },
          });
          stats.recordsInserted += 1;
        }
      }
      break;

    case "pen_efficiency":
      if (parsed.penEfficiency) {
        for (const row of parsed.penEfficiency) {
          stats.recordsRead += 1;
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
              batchId,
            },
          });
          stats.recordsInserted += 1;
        }
      }
      break;

    case "manual_weighings":
      if (parsed.manualWeighings) {
        for (const row of parsed.manualWeighings) {
          stats.recordsRead += 1;
          await prisma.feedRecord.create({
            data: {
              groupName: row.groupCode,
              date: new Date(row.date),
              remainder: row.weight || null,
              source: "dtm",
              batchId,
            },
          });
          stats.recordsInserted += 1;
        }
      }
      break;

    default:
      if (parsed.generic) {
        for (const row of parsed.generic.rows) {
          stats.recordsRead += 1;
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
              batchId,
            },
          });
          stats.recordsInserted += 1;
        }
      }
      break;
  }

  return {
    ...stats,
    type: parsed.type,
  };
}

async function executeFileImport(sourceName: SourceName, filePath: string, farm: { id: string }) {
  const fileHash = hashFile(filePath);

  const alreadyCompleted = await prisma.integrationBatch.findFirst({
    where: {
      source: sourceName,
      fileHash,
      status: "completed",
    },
    orderBy: { createdAt: "desc" },
  });

  if (alreadyCompleted) {
    const batch = await createBatch(sourceName, filePath, fileHash);
    const stats: ImportStats = {
      recordsRead: 0,
      recordsInserted: 0,
      recordsUpdated: 0,
      recordsSkipped: 0,
    };

    await prisma.integrationBatch.update({
      where: { id: batch.id },
      data: {
        status: "completed",
        recordsSkipped: 1,
        recordCount: 0,
        finishedAt: new Date(),
        processedAt: new Date(),
        errorMessage: `Файл уже успешно импортирован в batch ${alreadyCompleted.id}`,
      },
    });

    return {
      stats,
      skippedByHash: true,
      batchId: batch.id,
      type: undefined,
    };
  }

  const batch = await createBatch(sourceName, filePath, fileHash);

  try {
    if (!isSupportedFile(sourceName, filePath)) {
      throw new ImportFileError(getUnsupportedFileMessage(sourceName, filePath));
    }

    let result: SourceImportResult;

    if (sourceName === "afimilk") {
      result = isAfimilkDayMilkFile(filePath)
        ? await importAfimilkDayMilkFile(filePath, farm, batch.id)
        : await importAfimilkFile(filePath, farm, batch.id);
    } else if (sourceName === "aic") {
      result = await importAicFile(filePath, farm, batch.id);
    } else {
      result = await importDtmFile(filePath, batch.id);
    }

    await completeBatch(batch.id, result);
    await markSourceSynced(sourceName);

    return {
      stats: result,
      skippedByHash: false,
      batchId: batch.id,
      type: result.type,
    };
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    const stats =
      error instanceof ImportFileError
        ? error.stats
        : {
            recordsRead: 0,
            recordsInserted: 0,
            recordsUpdated: 0,
            recordsSkipped: 0,
          };
    await failBatch(batch.id, message, stats);
    throw error;
  }
}

export async function runImportForSource(sourceName: SourceName) {
  ensureDirectories();
  const farm = await getOrCreateFarm();

  const inboxDir = path.join(DIRS.inbox, sourceName);
  const processedDir = path.join(DIRS.processed, sourceName);
  const errorDir = path.join(DIRS.error, sourceName);

  const resultRows: {
    source: SourceName;
    file: string;
    status: "completed" | "error";
    type?: string;
    recordsRead?: number;
    recordsInserted?: number;
    recordsUpdated?: number;
    recordsSkipped?: number;
    skippedByHash?: boolean;
    error?: string;
  }[] = [];

  if (!fs.existsSync(inboxDir)) {
    return { source: sourceName, results: resultRows };
  }

  const files = fs
    .readdirSync(inboxDir)
    .filter((entry) => !fs.statSync(path.join(inboxDir, entry)).isDirectory());

  for (const file of files) {
    const filePath = path.join(inboxDir, file);

    try {
      const importResult = await executeFileImport(sourceName, filePath, farm);
      moveFile(filePath, processedDir);

      resultRows.push({
        source: sourceName,
        file,
        status: "completed",
        type: importResult.type,
        recordsRead: importResult.stats.recordsRead,
        recordsInserted: importResult.stats.recordsInserted,
        recordsUpdated: importResult.stats.recordsUpdated,
        recordsSkipped: importResult.skippedByHash
          ? importResult.stats.recordsSkipped + 1
          : importResult.stats.recordsSkipped,
        skippedByHash: importResult.skippedByHash,
      });
    } catch (error: any) {
      moveFile(filePath, errorDir);
      resultRows.push({
        source: sourceName,
        file,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { source: sourceName, results: resultRows };
}

export async function runImport() {
  const results = [];
  for (const sourceName of SOURCES) {
    results.push(await runImportForSource(sourceName));
  }
  return { results };
}
