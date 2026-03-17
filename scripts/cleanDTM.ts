import prisma from '../src/lib/prisma';

async function cleanDTM() {
  await prisma.groupUnit.updateMany({ data: { headCount: 0 } });
  const result = await prisma.feedRecord.deleteMany({
    where: { source: 'dtm' }
  });
  console.log(`Deleted ${result.count} DTM FeedRecords and reset GroupUnit headcounts.`);
}

cleanDTM().catch(console.error).finally(() => prisma.$disconnect());
