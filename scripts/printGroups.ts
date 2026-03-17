import prisma from "../src/lib/prisma";

async function main() {
  const groups = await prisma.groupUnit.findMany({
    select: { name: true, type: true, _count: { select: { cows: true, feedRecords: true } } }
  });
  console.log(groups);
}

main().catch(console.error).finally(() => prisma.$disconnect());
