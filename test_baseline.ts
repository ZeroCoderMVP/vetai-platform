import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function test() {
  try {
    console.log("Counting total animals...");
    const totalAnimals = await prisma.cow.count({
      where: { status: { notIn: ['dead', 'culled'] } }
    });
    console.log("Total animals:", totalAnimals);
    
    console.log("Counting milking cows...");
    const milkingCows = await prisma.cow.count({
      where: { status: 'active' }
    });
    console.log("Milking cows:", milkingCows);
    
    console.log("Counting dry cows...");
    const dryCows = await prisma.cow.count({
      where: { status: 'dry' }
    });
    console.log("Dry cows:", dryCows);

    console.log("Getting latest yield date...");
    const latestYieldDate = await prisma.afimilkDayMilk.findFirst({
      orderBy: { date: 'desc' },
      select: { date: true }
    });
    console.log("Latest yield date:", latestYieldDate);

    if (latestYieldDate) {
      console.log("Aggregating milk...");
      const sumResult = await prisma.afimilkDayMilk.aggregate({
        where: { date: latestYieldDate.date },
        _sum: { actualTotal: true }
      });
      console.log("Sum result:", sumResult);
    }
    
    console.log("Test completely successful!");
  } catch (err) {
    console.error("Error occurred:", err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
