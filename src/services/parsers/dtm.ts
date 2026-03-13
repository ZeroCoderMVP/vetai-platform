import * as fs from "fs";
import * as path from "path";
import * as XLSX from "xlsx";

// ==========================================
// Типы данных DTM отчётов
// ==========================================

export interface DTMFeedRow {
  groupName: string;
  date: string;
  recipe: string;
  planned: number;
  actual: number;
  remainder: number;
  dryMatter: number;
  efficiency: number;
}

export interface DTMReport {
  date: string;
  rows: DTMFeedRow[];
  totalPlanned: number;
  totalActual: number;
  avgRemainder: number;
  avgEfficiency: number;
}

export interface MixHistoryRow {
  code: number;
  recipeName: string;
  dtmBatchId: number;
  headCount: number;
  date: string;
  startTime: string;
  endTime: string;
  loadDuration: string;
  mixDuration: string;
  mixer: string;
  pauseDuration: string;
  totalDuration: string;
}

export interface IngredientConsumptionRow {
  ingredientCode: string;
  ingredientName: string;
  targetWeight: number;
  indicatorWeight: number;
  actualWeight: number;
  loadedDM: number;
  errorPercent: number;
  errorAbsPercent: number;
  totalConsumption: number;
  date: string;
}

export interface PenHistoryRow {
  groupCode: string;
  recipeName: string;
  date: string;
  feedingCount: number;
  headCount: number;
  corrPercent: number;
  targetWeight: number;
  indicatorWeight: number;
  actualWeight: number;
}

export interface PenEfficiencyRow {
  groupCode: string;
  recipeName: string;
  groupType: string;
  date: string;
  headCount: number;
  iofc: number;
  avgProductivity: number;
  milkYield: number;
  milkYieldPerCow: number;
}

export interface ManualWeighingRow {
  groupCode: string;
  date: string;
  time: string;
  weight: number;
  remainderPercent: number;
}

// ==========================================
// Определение типа DTM-отчёта
// ==========================================

export type DTMReportType = 
  | "mix_history" 
  | "ingredient_consumption" 
  | "pen_history" 
  | "pen_efficiency" 
  | "manual_weighings" 
  | "generic";

export function detectDTMReportType(filePath: string, sheet: XLSX.WorkSheet): DTMReportType {
  const basename = path.basename(filePath).toLowerCase();
  
  // По имени файла
  if (basename.includes("замес") || basename.includes("mix")) return "mix_history";
  if (basename.includes("ingredient") || basename.includes("ингредиент") || basename.includes("потреблен")) return "ingredient_consumption";
  if (basename.includes("pen-history") || basename.includes("история загон") || basename.includes("pen-history")) return "pen_history";
  if (basename.includes("efficiency") || basename.includes("эффективност")) return "pen_efficiency";
  if (basename.includes("manual") || basename.includes("взвеш") || basename.includes("weighing")) return "manual_weighings";
  
  // По содержимому колонок (первая строка)
  const headers = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 })[0] as string[] || [];
  const headerStr = headers.map(h => String(h || "").toLowerCase()).join(" ");
  
  if (headerStr.includes("замес") || headerStr.includes("id замеса") || headerStr.includes("mix")) return "mix_history";
  if (headerStr.includes("ингредиент") || headerStr.includes("ingredient") || headerStr.includes("целевой вес")) return "ingredient_consumption";
  if (headerStr.includes("корр.") || headerStr.includes("ежедневное кормление") || headerStr.includes("целевой вес на индикаторе")) return "pen_history";
  if (headerStr.includes("iofc") || headerStr.includes("продуктивность") || headerStr.includes("efficiency")) return "pen_efficiency";
  if (headerStr.includes("взвешивание") || headerStr.includes("weighing") || headerStr.includes("остаток %")) return "manual_weighings";
  
  return "generic";
}

// ==========================================
// Извлечение даты из файла
// ==========================================

function extractDate(filePath: string): string {
  const basename = path.basename(filePath, path.extname(filePath));
  const dateMatch = basename.match(/(\d{4})[.-]?(\d{2})[.-]?(\d{2})/);
  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }
  return new Date().toISOString().split("T")[0];
}

// ==========================================
// Парсер: История замесов
// ==========================================

export function parseMixHistory(filePath: string): MixHistoryRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: "" });
  const dateStr = extractDate(filePath);
  const rows: MixHistoryRow[] = [];

  for (const row of rawData) {
    const code = Number(row["Код"] || row["Code"] || 0);
    const recipeName = String(row["Замес"] || row["Recipe"] || row["Рецепт"] || "").trim();
    if (!recipeName) continue;

    const dtmBatchId = Number(row["ID Замеса"] || row["ID"] || row["BatchId"] || 0);
    const headCount = Number(row["Голов"] || row["Heads"] || row["Count"] || 0);
    
    // Дата из строки или из имени файла
    const rowDate = row["Дата"] || row["Date"] || "";
    const date = rowDate ? formatDateValue(rowDate) : dateStr;

    rows.push({
      code,
      recipeName,
      dtmBatchId,
      headCount,
      date,
      startTime: String(row["Время начала"] || row["Start"] || ""),
      endTime: String(row["Время окончания"] || row["End"] || ""),
      loadDuration: String(row["Общее время загрузки"] || row["Load Time"] || ""),
      mixDuration: String(row["Общее время разгрузки"] || row["Mix Time"] || ""),
      mixer: String(row["Кормо-смеситель"] || row["Mixer"] || row["Трактор"] || ""),
      pauseDuration: String(row["Общее времени паузы"] || row["Pause"] || ""),
      totalDuration: String(row["Общее время"] || row["Total"] || ""),
    });
  }

  return rows;
}

// ==========================================
// Парсер: Потребление ингредиентов
// ==========================================

export function parseIngredientConsumption(filePath: string): IngredientConsumptionRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });
  const dateStr = extractDate(filePath);
  const rows: IngredientConsumptionRow[] = [];

  for (const row of rawData) {
    const name = String(
      row["Ингредиент"] || row["Ingredient"] || row["Название"] || ""
    ).trim();
    if (!name || name === "0") continue;

    const ingredientCode = String(
      row["Идентификатор ингредиент..."] || row["Идентификатор"] || row["ID"] || row["Code"] || ""
    ).trim();

    rows.push({
      ingredientCode,
      ingredientName: name,
      targetWeight: Number(row["Целевой вес, кг"] || row["Target"] || row["План"] || 0),
      indicatorWeight: Number(row["Целевой вес на Индикаторе, кг"] || row["Indicator"] || 0),
      actualWeight: Number(row["Загружено, кг"] || row["Actual"] || row["Факт"] || 0),
      loadedDM: Number(row["Загруженное СВ, кг"] || row["DM"] || 0),
      errorPercent: Number(row["Ошибка (%)"] || row["Error"] || 0),
      errorAbsPercent: Number(row["Погрешность в % от нагрузки (АБС)"] || row["Error ABS"] || 0),
      totalConsumption: Number(row["Общая потребность (АБ"] || row["Total"] || 0),
      date: dateStr,
    });
  }

  return rows;
}

// ==========================================
// Парсер: История групп (загонов)
// ==========================================

export function parsePenHistory(filePath: string): PenHistoryRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });
  const dateStr = extractDate(filePath);
  const rows: PenHistoryRow[] = [];

  for (const row of rawData) {
    const groupCode = String(
      row["Код Технологической группы"] || row["Код"] || row["Group"] || ""
    ).trim();
    if (!groupCode || groupCode === "0") continue;

    const rowDate = row["Дата"] || row["Date"] || "";
    const date = rowDate ? formatDateValue(rowDate) : dateStr;

    rows.push({
      groupCode,
      recipeName: String(row["Технологическая группа"] || row["Recipe"] || row["Рецепт"] || ""),
      date,
      feedingCount: Number(row["Ежедневное кормление"] || row["Feedings"] || 0),
      headCount: Number(row["Среднее количество коров #"] || row["Heads"] || row["Коров"] || 0),
      corrPercent: Number(row["Корр. %"] || row["Corr"] || 100),
      targetWeight: Number(row["Целевой вес, кг"] || row["Target"] || 0),
      indicatorWeight: Number(row["Целевой вес на Индикаторе, кг"] || row["Indicator"] || 0),
      actualWeight: Number(row["Кормление, кг"] || row["Fed"] || row["Actual"] || 0),
    });
  }

  return rows;
}

// ==========================================
// Парсер: Эффективность загонов (IOFC)
// ==========================================

export function parsePenEfficiency(filePath: string): PenEfficiencyRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });
  const dateStr = extractDate(filePath);
  const rows: PenEfficiencyRow[] = [];

  for (const row of rawData) {
    const groupCode = String(
      row["Код Технологической группы"] || row["Код"] || row["Group"] || ""
    ).trim();
    if (!groupCode || groupCode === "0") continue;

    const rowDate = row["Дата"] || row["Date"] || "";
    const date = rowDate ? formatDateValue(rowDate) : dateStr;

    rows.push({
      groupCode,
      recipeName: String(row["Название технологической группы"] || row["Recipe"] || ""),
      groupType: String(row["Тип технологической группы"] || row["Type"] || ""),
      date,
      headCount: Number(row["Коров #"] || row["Heads"] || 0),
      iofc: Number(row["IOFC, Р"] || row["IOFC"] || 0),
      avgProductivity: Number(row["Средняя продуктивность коров"] || row["Productivity"] || 0),
      milkYield: Number(row["Количество молока, Kg"] || row["MilkYield"] || 0),
      milkYieldPerCow: Number(row["Количество моло"] || row["MilkPerCow"] || 0),
    });
  }

  return rows;
}

// ==========================================
// Парсер: Ручные взвешивания
// ==========================================

export function parseManualWeighings(filePath: string): ManualWeighingRow[] {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });
  const dateStr = extractDate(filePath);
  const rows: ManualWeighingRow[] = [];

  for (const row of rawData) {
    const groupCode = String(
      row["Группа"] || row["Загон"] || row["Секция"] || row["Group"] || ""
    ).trim();
    if (!groupCode || groupCode === "0") continue;

    const rowDate = row["Дата"] || row["Date"] || "";
    const date = rowDate ? formatDateValue(rowDate) : dateStr;

    rows.push({
      groupCode,
      date,
      time: String(row["Время"] || row["Time"] || ""),
      weight: Number(row["Вес"] || row["Weight"] || row["кг"] || 0),
      remainderPercent: Number(row["Остаток %"] || row["Remainder"] || 0),
    });
  }

  return rows;
}

// ==========================================
// Генерический парсер (старый формат)
// ==========================================

export function parseDTMExcel(filePath: string): DTMReport {
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { defval: 0 });

  const rows: DTMFeedRow[] = [];
  const dateStr = extractDate(filePath);

  for (const row of rawData) {
    const groupName = String(
      row["Группа"] || row["Загон"] || row["Секция"] || row["Pen"] || row["Group"] || ""
    ).trim();

    if (!groupName || groupName === "0") continue;

    const recipe = String(row["Рецепт"] || row["Recipe"] || row["Рацион"] || "").trim();
    const planned = Number(row["План"] || row["Planned"] || row["Target"] || 0);
    const actual = Number(row["Факт"] || row["Actual"] || row["Fed"] || row["As-Fed"] || 0);
    const remainder = Number(row["Остаток"] || row["Remainder"] || row["Refusal"] || 0);
    const dryMatter = Number(row["СВ"] || row["DM"] || row["Dry Matter"] || 0);
    const efficiency = actual > 0 && planned > 0 ? (actual / planned) * 100 : 0;

    rows.push({
      groupName,
      date: dateStr,
      recipe,
      planned,
      actual,
      remainder,
      dryMatter,
      efficiency: Math.round(efficiency * 10) / 10,
    });
  }

  const totalPlanned = rows.reduce((s, r) => s + r.planned, 0);
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const avgRemainder = rows.length > 0
    ? rows.reduce((s, r) => s + r.remainder, 0) / rows.length
    : 0;
  const avgEfficiency = rows.length > 0
    ? rows.reduce((s, r) => s + r.efficiency, 0) / rows.length
    : 0;

  return {
    date: dateStr,
    rows,
    totalPlanned,
    totalActual,
    avgRemainder: Math.round(avgRemainder * 10) / 10,
    avgEfficiency: Math.round(avgEfficiency * 10) / 10,
  };
}

// ==========================================
// Умный парсер — определяет тип и вызывает нужный парсер
// ==========================================

export interface SmartDTMResult {
  type: DTMReportType;
  mixHistory?: MixHistoryRow[];
  ingredientConsumption?: IngredientConsumptionRow[];
  penHistory?: PenHistoryRow[];
  penEfficiency?: PenEfficiencyRow[];
  manualWeighings?: ManualWeighingRow[];
  generic?: DTMReport;
}

export function parseSmartDTM(filePath: string): SmartDTMResult {
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const type = detectDTMReportType(filePath, sheet);

  switch (type) {
    case "mix_history":
      return { type, mixHistory: parseMixHistory(filePath) };
    case "ingredient_consumption":
      return { type, ingredientConsumption: parseIngredientConsumption(filePath) };
    case "pen_history":
      return { type, penHistory: parsePenHistory(filePath) };
    case "pen_efficiency":
      return { type, penEfficiency: parsePenEfficiency(filePath) };
    case "manual_weighings":
      return { type, manualWeighings: parseManualWeighings(filePath) };
    default:
      return { type: "generic", generic: parseDTMExcel(filePath) };
  }
}

// ==========================================
// Парсит все XLSX файлы из директории
// ==========================================

export function parseDTMDirectory(dirPath: string): DTMReport[] {
  if (!fs.existsSync(dirPath)) return [];
  
  const files = fs.readdirSync(dirPath).filter(
    (f) => f.endsWith(".xlsx") || f.endsWith(".xls") || f.endsWith(".csv")
  );

  return files.map((f) => parseDTMExcel(path.join(dirPath, f)));
}

// ==========================================
// Утилиты
// ==========================================

function formatDateValue(val: any): string {
  if (!val) return new Date().toISOString().split("T")[0];
  
  // Excel serial date
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) {
      return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
    }
  }
  
  const s = String(val).trim();
  
  // DD/MM/YYYY or DD.MM.YYYY
  const match = s.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  
  // YYYY-MM-DD
  const isoMatch = s.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return s.substring(0, 10);
  
  // Try Date parsing
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
  } catch {}
  
  return new Date().toISOString().split("T")[0];
}
