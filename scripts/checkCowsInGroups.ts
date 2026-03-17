import prisma from "../src/lib/prisma";

async function main() {
  const groups = await prisma.groupUnit.findMany({
    include: {
      _count: {
        select: { cows: true }
      }
    }
  });

  console.log(`Group cow distribution:`);
  let totalLinked = 0;
  for (const group of groups) {
    if (group._count.cows > 0) {
      console.log(`- ${group.name}: ${group._count.cows} cows`);
      totalLinked += group._count.cows;
    }
  }
  const totalCows = await prisma.cow.count();
  console.log(`Total cows linked to a group: ${totalLinked} out of ${totalCows}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
