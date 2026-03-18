import prisma from '../src/lib/prisma';

async function main() {
  const farm = await prisma.farm.findFirst();
  if (!farm) throw new Error("No farm found. Please seed basic data first.");

  const cows = await prisma.cow.findMany({
    orderBy: { createdAt: 'asc' }
  });

  const milking = cows.filter((c: any) => c.status === "active" || c.status === "Дойная" || c.status === "milking");
  const dry = cows.filter((c: any) => c.status === "dry" || c.status === "Сухостойная");
  const calves = cows.filter((c: any) => c.status === "heifer" || c.status === "Тёлка" || c.status === "calf" || (c.status && c.status.toLowerCase().includes("тел")));
  
  // Assign others that didn't match the above
  const assignedSet = new Set([...milking, ...dry, ...calves].map((c: any) => c.id));
  const others = cows.filter((c: any) => !assignedSet.has(c.id));

  const categorize = (list: any[], prefix: string, typeLabel: string, maxPerSection: number) => {
    const chunks = [];
    for(let i=0; i<list.length; i+=maxPerSection) {
       chunks.push(list.slice(i, i+maxPerSection));
    }
    return chunks.map((chunk, i) => ({
      name: `${prefix} ${i+1}`,
      type: typeLabel,
      cows: chunk
    }));
  };

  const sectionsData = [
    // We split them logically
    ...categorize(milking, "Секция М", "дойная", 95),
    ...categorize(dry, "Секция С", "сухостой", 75),
    ...categorize(calves, "Секция Т", "телята", 110),
  ];

  if (others.length > 0) {
     sectionsData.push(...categorize(others, "Секция Р", "разное", 80));
  }

  // Clear existing relationships safely
  await prisma.$executeRawUnsafe(`UPDATE Event SET sectionId = NULL`);
  await prisma.cowSectionHistory.deleteMany({});
  await prisma.groupSectionHistory.deleteMany({});
  
  // Set cow section/barn null to detach foreign keys
  await prisma.$executeRawUnsafe(`UPDATE Cow SET currentSectionId = NULL, barnId = NULL`);
  
  await prisma.section.deleteMany({});
  await prisma.barn.deleteMany({});

  let currentBarnIndex = 1;
  let currentBarn: any = null;
  let sectionsInBarn = 0;

  let totalSections = 0;

  const sysDateStr = process.env.VETAI_DEMO_DATE || "2026-03-05";
  const baseDate = new Date(sysDateStr);

  for (const s of sectionsData) {
     if (!currentBarn || sectionsInBarn >= 4) {
        currentBarn = await prisma.barn.create({
           data: {
              farmId: farm.id,
              name: `Коровник ${currentBarnIndex++}`,
           }
        });
        sectionsInBarn = 0;
     }

     const dbSection = await prisma.section.create({
        data: {
           farmId: farm.id,
           barnId: currentBarn.id,
           name: s.name,
           type: s.type,
           isActive: true
        }
     });
     sectionsInBarn++;
     totalSections++;

     const cowIds = s.cows.map((c: any) => c.id);
     
     if (cowIds.length > 0) {
        // chunk updates
        for(let j=0; j<cowIds.length; j+=50) {
            const chunk = cowIds.slice(j, j+50);
            await prisma.cow.updateMany({
                where: { id: { in: chunk } },
                data: {
                   currentSectionId: dbSection.id,
                   barnId: currentBarn.id
                }
            });
        }

        // Generate history
        const histories = cowIds.map((cowId: string) => {
            const offset = Math.floor(Math.random() * 30); // 0 to 30 days ago
            const start = new Date(baseDate);
            start.setDate(start.getDate() - offset);
            return {
                cowId,
                sectionId: dbSection.id,
                startDate: start,
                source: "seed"
            };
        });

        // chunk creates
        for(let j=0; j<histories.length; j+=50) {
            const historyChunk = histories.slice(j, j+50);
            await prisma.cowSectionHistory.createMany({
                data: historyChunk
            });
        }
     }
  }

  console.log(`Seeding complete: Created ${currentBarnIndex - 1} barns and ${totalSections} sections. Assigned ${cows.length} cows to sections logicallly.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect()
})
