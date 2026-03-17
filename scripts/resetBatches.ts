import prisma from "../src/lib/prisma";

async function main() {
  const result = await prisma.integrationBatch.updateMany({
    data: { status: "error" }
  });
  console.log(`Reset ${result.count} batches to error state`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
