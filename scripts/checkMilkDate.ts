import prisma from "../src/lib/prisma";

async function main() {
  const milk = await prisma.afimilkDayMilk.findFirst({
     orderBy: { date: 'desc' }
  });
  console.log("Latest milk record:", milk);
}
main().catch(console.error);
