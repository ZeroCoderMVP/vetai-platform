export type DayMilkRecord = {
  date: Date;
  cowNumber: string;
  avg10Session1: number;
  actualSession1: number;
  avg10Session2: number;
  actualSession2: number;
  avg10Session3: number;
  actualSession3: number;
};

export type DayMilkParseResult = {
  rowsRead: number;
  rowsSkipped: number;
  records: DayMilkRecord[];
};

const DATE_LINE_REGEX = /^(\d{2})\/(\d{2})\/(\d{2})$/;
const COW_LINE_REGEX = /^(\d+)\s+([-+]?\d+(?:[.,]\d+)?)\s+([-+]?\d+(?:[.,]\d+)?)\s+([-+]?\d+(?:[.,]\d+)?)\s+([-+]?\d+(?:[.,]\d+)?)\s+([-+]?\d+(?:[.,]\d+)?)\s+([-+]?\d+(?:[.,]\d+)?)\s*$/;

function normalizeCowNumber(value: string): string {
  const normalized = value.replace(/^0+/, "").trim();
  return normalized === "" ? "0" : normalized;
}

function parseDateLine(raw: string): Date | null {
  const match = raw.match(DATE_LINE_REGEX);
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(`20${match[3]}`);

  if (!Number.isInteger(day) || !Number.isInteger(month)) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}

function parseNumber(raw: string): number {
  const normalized = raw.replace(",", ".").trim();
  const value = Number(normalized);

  if (!Number.isFinite(value)) {
    throw new Error(`Invalid numeric value '${raw}'`);
  }

  return value;
}

export function parseDayMilkDat(content: string): DayMilkParseResult {
  const lines = content.split(/\r?\n/);
  const records: DayMilkRecord[] = [];

  let currentDate: Date | null = null;
  let rowsRead = 0;
  let rowsSkipped = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (line === "") {
      continue;
    }

    const parsedDate = parseDateLine(line);
    if (parsedDate) {
      currentDate = parsedDate;
      continue;
    }

    rowsRead += 1;

    const match = line.match(COW_LINE_REGEX);
    if (!match || !currentDate) {
      rowsSkipped += 1;
      continue;
    }

    try {
      records.push({
        date: currentDate,
        cowNumber: normalizeCowNumber(match[1]),
        avg10Session1: parseNumber(match[2]),
        actualSession1: parseNumber(match[3]),
        avg10Session2: parseNumber(match[4]),
        actualSession2: parseNumber(match[5]),
        avg10Session3: parseNumber(match[6]),
        actualSession3: parseNumber(match[7]),
      });
    } catch {
      rowsSkipped += 1;
    }
  }

  return {
    rowsRead,
    rowsSkipped,
    records,
  };
}
