import prisma from '../src/lib/prisma';

async function syncHeadcounts() {
  const records = await prisma.feedRecord.findMany({
    where: { headCount: { gt: 0 } },
    orderBy: { date: 'desc' },
  });

  const latestCounts = new Map<string, number>();
  for (const r of records) {
    if (!latestCounts.has(r.groupName) && r.headCount) {
      latestCounts.set(r.groupName, r.headCount);
    }
  }

  let updated = 0;
  for (const [groupName, count] of latestCounts.entries()) {
    const group = await prisma.groupUnit.findFirst({ where: { name: groupName } });
    if (group && group.headCount !== count) {
      await prisma.groupUnit.update({ where: { id: group.id }, data: { headCount: count } });
      updated++;
      console.log(`Updated group ${groupName} to headcount ${count}`);
    }
  }
  console.log(`Finished updating ${updated} groups`);
}

syncHeadcounts().catch(console.error).finally(() => prisma.$disconnect());
