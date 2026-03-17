import pkg from 'file:///C:/vetai-platform/src/generated/prisma/default.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

async function main() {
  try {
    const cowId = 'cmmqy7qd4001lj47k64bnefxm';
    const cow = await prisma.cow.findUnique({
      where: { id: cowId },
      include: {
        group: true,
        milkRecords: {
          orderBy: { date: 'desc' },
          take: 90
        },
        events: {
          orderBy: { timestamp: 'desc' },
          take: 20
        }
      }
    });

    if (!cow) {
      console.log("Not found");
      return;
    }

    // Mapping tests...
    console.log("Query Successful", cow.id, cow.number);
    console.log("MilkRecords:", cow.milkRecords.length);
    console.log("Events:", cow.events.length);
  } catch (e) {
    console.error("Prisma error:", e);
  }
}

main().finally(() => prisma.$disconnect());
