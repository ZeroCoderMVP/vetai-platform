import prisma from "./src/lib/prisma";

async function fixDuplicates() {
  console.log('Fixing duplicate EconomicFact records...');
  // We will simply wipe out the synthetic facts and recreate exactly 1 per day for milk_sold, milk_calves, milk_loss, milk_revenue
  
  await prisma.economicFact.deleteMany({
      where: { source: 'synthetic_demo', type: { in: ['milk_sold', 'milk_calves', 'milk_loss', 'milk_revenue'] } }
  });

  console.log('Deleted old synthetic milk facts. Recreating cleanly...');
  
  for(let i=0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const targetDateStart = new Date(dStr + 'T00:00:00Z');
    const targetDateEnd = new Date(dStr + 'T23:59:59Z');

    const afi = await prisma.afimilkDayMilk.aggregate({
      _sum: { actualTotal: true },
      where: { date: { gte: targetDateStart, lte: targetDateEnd } }
    });

    const total = afi._sum.actualTotal || 0;
    if (total === 0) continue;

    const sold = total * 0.92;
    const calves = total * 0.06;
    const loss = total * 0.02;
    const rev = sold * 35.5;

    const farmArgs = await prisma.farm.findFirst();
    if (!farmArgs) continue;

    const shared = {
        farmId: farmArgs.id,
        period: targetDateStart,
        source: 'synthetic_demo'
    };

    await prisma.economicFact.createMany({
        data: [
            { ...shared, type: 'milk_sold', value: sold },
            { ...shared, type: 'milk_calves', value: calves },
            { ...shared, type: 'milk_loss', value: loss },
            { ...shared, type: 'milk_revenue', value: rev }
        ]
    });
  }
  console.log('Done recreating economics single records!');
}

fixDuplicates().catch(console.error).finally(() => process.exit(0));
