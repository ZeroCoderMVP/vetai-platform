import prisma from '../src/lib/prisma';

async function main() {
  // 4. IntegrationBatch proofs
  const latestBatches = await prisma.integrationBatch.findMany({
    orderBy: { startedAt: 'desc' },
    take: 5,
    select: { source: true, filename: true, fileHash: true, startedAt: true, finishedAt: true, status: true, recordsRead: true, recordsInserted: true, recordsUpdated: true, recordsSkipped: true, errorMessage: true }
  });

  const duplicateHashProof = await prisma.integrationBatch.findMany({
    where: { status: 'completed' },
    orderBy: { startedAt: 'desc' },
    take: 2,
    select: { fileHash: true, filename: true, status: true, recordsSkipped: true }
  });

  // 5. AFI proofs
  const afiCows = await prisma.cow.findMany({
    where: { externalIds: { some: { source: 'afimilk' } } },
    take: 2,
    select: { number: true, status: true, lactation: true, dim: true }
  });

  const afiEvents = await prisma.event.findMany({
    where: { source: 'system', title: { in: ['Кетоз', 'Мастит', 'Отел', 'Осеменен'] } },
    take: 2,
    select: { cowId: true, title: true, description: true, timestamp: true }
  });

  // 6. AIC proofs
  const aicMilks = await prisma.milkRecord.findMany({
    where: { source: 'aic' },
    take: 3,
    orderBy: { date: 'desc' },
    select: { cowNumber: true, session: true, yield: true, date: true }
  });
  
  const aicDayMilks = await prisma.afimilkDayMilk.findMany({
    take: 1,
    select: { cowNumber: true, avg10Session1: true, actualSession1: true, avg10Session2: true, actualSession2: true, avg10Total: true, actualTotal: true }
  });

  // 7. DTM proofs
  const dtmBatches = await prisma.mixBatch.findMany({
    take: 2,
    select: { recipeName: true, groupCode: true, date: true, headCount: true }
  });
  const dtmConsumptions = await prisma.ingredientConsumption.findMany({
    take: 2,
    select: { ingredientName: true, targetWeight: true, actualWeight: true, errorPercent: true }
  });
  const dtmFeedRecords = await prisma.feedRecord.findMany({
    take: 2,
    select: { groupName: true, planned: true, actual: true, remainder: true }
  });

  console.log(JSON.stringify({
    batches: latestBatches,
    duplicates: duplicateHashProof,
    afiCows,
    afiEvents,
    aicMilks,
    aicDayMilks,
    dtmBatches,
    dtmConsumptions,
    dtmFeedRecords
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
