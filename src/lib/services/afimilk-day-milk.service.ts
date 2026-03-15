import prisma from "@/lib/prisma";

type DayMilkSessionSummary = {
  avg10: number;
  actual: number;
};

type DayMilkSummary = {
  cowId: string | null;
  cowNumber: string;
  date: Date;
  session1: DayMilkSessionSummary;
  session2: DayMilkSessionSummary;
  session3: DayMilkSessionSummary;
  total: DayMilkSessionSummary;
  sourceFile: string | null;
};

function toDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toDayMilkSummary(record: {
  cowId: string | null;
  cowNumber: string;
  date: Date;
  avg10Session1: number;
  actualSession1: number;
  avg10Session2: number;
  actualSession2: number;
  avg10Session3: number;
  actualSession3: number;
  avg10Total: number;
  actualTotal: number;
  sourceFile: string | null;
}): DayMilkSummary {
  return {
    cowId: record.cowId,
    cowNumber: record.cowNumber,
    date: record.date,
    session1: {
      avg10: record.avg10Session1,
      actual: record.actualSession1,
    },
    session2: {
      avg10: record.avg10Session2,
      actual: record.actualSession2,
    },
    session3: {
      avg10: record.avg10Session3,
      actual: record.actualSession3,
    },
    total: {
      avg10: record.avg10Total,
      actual: record.actualTotal,
    },
    sourceFile: record.sourceFile,
  };
}

function buildCowFilter(params: { cowId?: string; cowNumber?: string }) {
  if (params.cowId) {
    return { cowId: params.cowId };
  }

  if (params.cowNumber) {
    return { cowNumber: params.cowNumber };
  }

  throw new Error("Either cowId or cowNumber must be provided");
}

const dayMilkSelect = {
  cowId: true,
  cowNumber: true,
  date: true,
  actualSession1: true,
  actualSession2: true,
  actualSession3: true,
  avg10Session1: true,
  avg10Session2: true,
  avg10Session3: true,
  actualTotal: true,
  avg10Total: true,
  sourceFile: true,
};

export async function getCowDayMilkSummary(params: {
  farmId: string;
  date: Date;
  cowId?: string;
  cowNumber?: string;
}) {
  const day = toDayStart(params.date);

  const record = await prisma.afimilkDayMilk.findFirst({
    where: {
      farmId: params.farmId,
      date: day,
      ...buildCowFilter(params),
    },
    select: dayMilkSelect,
  });

  return record ? toDayMilkSummary(record) : null;
}

export async function getCowDayMilkRange(params: {
  farmId: string;
  from: Date;
  to: Date;
  cowId?: string;
  cowNumber?: string;
}) {
  const from = toDayStart(params.from);
  const to = toDayStart(params.to);

  const records = await prisma.afimilkDayMilk.findMany({
    where: {
      farmId: params.farmId,
      date: {
        gte: from,
        lte: to,
      },
      ...buildCowFilter(params),
    },
    orderBy: {
      date: "asc",
    },
    select: dayMilkSelect,
  });

  return records.map(toDayMilkSummary);
}

export async function getCowDayMilkLastDays(params: {
  farmId: string;
  days: number;
  cowId?: string;
  cowNumber?: string;
}) {
  const records = await prisma.afimilkDayMilk.findMany({
    where: {
      farmId: params.farmId,
      ...buildCowFilter(params),
    },
    orderBy: {
      date: "desc",
    },
    take: params.days,
    select: dayMilkSelect,
  });

  return records.map(toDayMilkSummary);
}
