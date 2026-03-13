import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

function toNum(v: any): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

export async function GET() {
  const BASE_DIR = path.resolve(process.cwd(), "..");
  const DTM_DIR = path.join(BASE_DIR, "DTM");

  if (!fs.existsSync(DTM_DIR)) {
    return NextResponse.json({ error: "DTM directory not found: " + DTM_DIR }, { status: 404 });
  }

  const files = fs.readdirSync(DTM_DIR).filter((f) => f.endsWith(".xlsx"));
  const results: { file: string; type: string; count: number; error?: string }[] = [];

  // Get or create source
  let source = await prisma.dataSource.findUnique({ where: { name: "dtm" } });
  if (!source) {
    source = await prisma.dataSource.create({ data: { name: "dtm", type: "file", status: "active" } });
  }

  for (const file of files) {
    const filePath = path.join(DTM_DIR, file);
    const filenameLower = file.toLowerCase();

    const batch = await prisma.integrationBatch.create({
      data: { sourceId: source.id, filename: file, status: "processing" },
    });

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
      let recordCount = 0;
      let type = "generic";

      if (filenameLower.includes("замес") || filenameLower.includes("mix")) {
        type = "mix_history";
        for (const row of rawData) {
          const recipeName = String(row["Замес"] || row["Recipe"] || "").trim();
          if (!recipeName) continue;
          await (prisma as any).mixBatch.create({
            data: {
              dtmBatchId: toNum(row["ID Замеса"]),
              recipeName,
              groupCode: String(row["Код"] || ""),
              headCount: toNum(row["Группы #Корм"]) || toNum(row["Голов"]),
              date: parseDate(row["Дата"]),
              startTime: String(row["Время начала"] || ""),
              endTime: String(row["Время окончания"] || ""),
              loadDuration: String(row["Общее время загрузки"] || ""),
              mixDuration: String(row["Общее время разгрузки"] || ""),
              mixer: String(row["Кормо-смеситель"] || ""),
              pauseDuration: String(row["Общее время паузы"] || row["Общее времени паузы"] || ""),
              totalDuration: String(row["Общее время"] || ""),
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("ingredient") || filenameLower.includes("потреблен")) {
        type = "ingredient_consumption";
        for (const row of rawData) {
          // Excel has typo: "Ингридиент" (и instead of е)
          const name = String(row["Ингридиент"] || row["Ингредиент"] || row["Ingredient"] || "").trim();
          if (!name || name === "0") continue;
          await (prisma as any).ingredientConsumption.create({
            data: {
              ingredientCode: String(row["Идентификатор ингредиента"] || row["Идентификатор ингредиент..."] || row["Идентификатор"] || ""),
              ingredientName: name,
              targetWeight: toNum(row["Целевой вес, кг"]),
              indicatorWeight: toNum(row["Целевой вес на Индикаторе, кг"]),
              actualWeight: toNum(row["Загружено, кг"]),
              loadedDM: toNum(row["Загруженное СВ, кг"]),
              errorPercent: toNum(row["Ошибка (%)"]),
              errorAbsPercent: toNum(row["Погрешность в % от нагрузки (АБС)"]),
              totalConsumption: toNum(row["Общая погрешность (АБС), кг"] || row["Общая потребность (АБ"] || row["Общая потребл"]),
              date: new Date(),
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("pen-history") || filenameLower.includes("история загон")) {
        type = "pen_history";
        for (const row of rawData) {
          const groupCode = String(row["Код Технологической группы"] || row["Код"] || "").trim();
          if (!groupCode || groupCode === "0") continue;
          await prisma.feedRecord.create({
            data: {
              groupName: groupCode,
              date: parseDate(row["Дата"]),
              recipe: String(row["Технологическая группа"] || ""),
              planned: toNum(row["Целевой вес, кг"]),
              actual: toNum(row["Кормление, кг"]),
              remainder: toNum(row["Несъеденный (Вес), кг"]),
              dryMatter: toNum(row["С.В Потребление, кг"]),
              headCount: toNum(row["Среднее количество коров #"]),
              corrPercent: toNum(row["Корр. %"]),
              targetWeight: toNum(row["Целевой вес на Индикаторе, кг"]),
              feedingCount: toNum(row["Ежедневное кормление"]),
              groupType: String(row["Тип технологической группы"] || ""),
              feedCostPerHead: toNum(row["Стоимость/ Корова, ₽"]),
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("efficiency") || filenameLower.includes("эффективност")) {
        type = "pen_efficiency";
        for (const row of rawData) {
          const groupCode = String(row["Код Технологической группы"] || row["Код"] || "").trim();
          if (!groupCode || groupCode === "0") continue;
          await prisma.feedRecord.create({
            data: {
              groupName: groupCode,
              date: parseDate(row["Дата"]),
              recipe: String(row["Название технологической группы"] || ""),
              headCount: toNum(row["Коровы #"]) || toNum(row["Коров #"]),
              milkYield: toNum(row["Количество молока, Kg"]),
              iofc: toNum(row["IOFC, ₽"] || row["IOFC, Р"] || row["IOFC"]),
              actual: toNum(row["Общее количество кормления, Kg"]),
              dryMatter: toNum(row["Общее количество подаваемого СВ, Kg"]),
              remainder: toNum(row["Общее количество несъеденного, Kg"]),
              feedCostPerHead: toNum(row["Стоимость на корову, ₽"]),
              groupType: String(row["Тип технологической группы"] || ""),
              source: "dtm",
              batchId: batch.id,
            },
          });
          recordCount++;
        }
      } else if (filenameLower.includes("manual") || filenameLower.includes("взвеш")) {
        type = "manual_weighings";
        for (const row of rawData) {
          const groupName = String(row["Машина"] || row["Фидер"] || row["Группа"] || row["Загон"] || "manual").trim();
          if (!groupName || groupName === "0") continue;
          await prisma.feedRecord.create({
            data: {
              groupName,
              date: parseDate(row["Дата"]),
              remainder: toNum(row["Вес, Kg"] || row["Вес"] || row["Weight"]),
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

      results.push({ file, type, count: recordCount });
    } catch (err: any) {
      await prisma.integrationBatch.update({
        where: { id: batch.id },
        data: { status: "error", errors: err.message, processedAt: new Date() },
      });
      results.push({ file, type: "error", count: 0, error: err.message });
    }
  }

  await prisma.dataSource.update({
    where: { id: source.id },
    data: { lastSync: new Date(), status: "active" },
  });

  const feedCount = await prisma.feedRecord.count();
  const mixCount = await (prisma as any).mixBatch.count();
  const ingCount = await (prisma as any).ingredientConsumption.count();

  return NextResponse.json({
    success: true,
    files: results,
    totals: { feedRecords: feedCount, mixBatches: mixCount, ingredientConsumptions: ingCount },
  });
}

function parseDate(val: any): Date {
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
