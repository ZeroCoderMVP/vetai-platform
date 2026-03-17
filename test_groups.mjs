import pkg from 'file:///C:/vetai-platform/src/generated/prisma/default.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  const groups = await prisma.groupUnit.findMany({
    include: {
      _count: {
        select: { cows: true, feedRecords: true }
      }
    }
  });
  console.log("Groups:");
  for (const g of groups) {
    console.log(`- ${g.name}: ${g._count.cows} cows`);
  }

  const cowWithGroup = await prisma.cow.findFirst({
    where: { groupId: { not: null } }
  });
  console.log("Cow with group:", cowWithGroup?.id);

  const cowWithoutGroup = await prisma.cow.count({
    where: { groupId: null }
  });
  console.log("Cows without group:", cowWithoutGroup);
}

main().finally(() => prisma.$disconnect());
