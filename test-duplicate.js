const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cows = await prisma.cow.findMany({
    where: { number: '557252' }
  });
  console.log("Cows found:", cows);
}

main().finally(() => prisma.$disconnect());
