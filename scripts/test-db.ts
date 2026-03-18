import { PrismaClient } from '../src/generated/prisma';

const prisma = new PrismaClient();

async function main() {
  const batchCount = await prisma.integrationBatch.count();
  const farmCount = await prisma.farm.count();
  const cowCount = await prisma.cow.count();
  const eventCount = await prisma.event.count();
  
  const lastBatch = await prisma.integrationBatch.findFirst({
    orderBy: { startedAt: 'desc' }
  });

  console.log("=== DB COUNTS ===");
  console.log(JSON.stringify({ 
    counts: { batchCount, farmCount, cowCount, eventCount },
    lastBatch 
  }, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
