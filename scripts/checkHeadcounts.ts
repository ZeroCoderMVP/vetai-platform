import prisma from "../src/lib/prisma";

async function main() {
  const groups = await prisma.groupUnit.findMany({
    include: {
      _count: { select: { cows: true, feedRecords: true } }
    }
  });

  const feedRecords = await prisma.feedRecord.findMany({
    select: { groupName: true, headCount: true },
    where: { headCount: { not: null } },
    take: 10
  });

  console.log("Groups headCount data:", groups.map(g => ({
    name: g.name,
    dbCowsCount: g._count.cows,
    storedHeadCount: g.headCount
  })));

  console.log("Sample feedRecord headcounts:", feedRecords);
}

main().catch(console.error).finally(() => prisma.$disconnect());
