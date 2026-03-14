import prisma from "@/lib/prisma";

function toDayStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

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
      ...(params.cowId ? { cowId: params.cowId } : {}),
      ...(!params.cowId && params.cowNumber ? { cowNumber: params.cowNumber } : {}),
    },
    select: {
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
    },
  });

  return record;
}
