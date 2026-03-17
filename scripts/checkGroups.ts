import prisma from "../src/lib/prisma";

async function main() {
  const count = await prisma.groupUnit.count();
  console.log(`There are exactly ${count} GroupUnit records.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
