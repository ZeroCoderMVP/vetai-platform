import prisma from "../src/lib/prisma";

async function main() {
  console.log("Starting event group sync...");

  // Select events from afimilk that lack a groupId but have a description
  const events = await prisma.event.findMany({
    where: {
      source: "afimilk",
      groupId: null,
      description: {
        not: null,
      },
      farmId: {
        not: null,
      },
    },
    select: {
      id: true,
      description: true,
      farmId: true,
    },
  });

  console.log(`Found ${events.length} afimilk events to process.`);

  let updatedCount = 0;
  let skippedCount = 0;

  // Cache groups from db to avoid excessive querying
  const farmGroupsCache: Record<string, Record<string, string>> = {};

  for (const event of events) {
    if (!event.description || !event.farmId) continue;

    let parsed: any;
    try {
      parsed = JSON.parse(event.description);
    } catch {
      // If description isn't valid JSON, skip
      skippedCount++;
      continue;
    }

    const rawGroup =
      parsed.group ||
      parsed.GroupNumber ||
      parsed.groupNumber ||
      parsed.animalGroup;

    if (rawGroup !== undefined && rawGroup !== null) {
      const groupName = String(rawGroup).trim();

      if (groupName) {
        // Load farm groups into cache if not present
        if (!farmGroupsCache[event.farmId]) {
          const groups = await prisma.groupUnit.findMany({
            where: { farmId: event.farmId },
            select: { id: true, name: true },
          });
          farmGroupsCache[event.farmId] = {};
          for (const g of groups) {
            farmGroupsCache[event.farmId][g.name] = g.id;
          }
        }

        const groupId = farmGroupsCache[event.farmId][groupName];

        if (groupId) {
          await prisma.event.update({
            where: { id: event.id },
            data: { groupId },
          });
          updatedCount++;
          continue;
        }
      }
    }
    
    // If no group info found in JSON or matching group not in DB
    skippedCount++;
  }

  console.log(`\nSync complete!`);
  console.log(`Updated successfully: ${updatedCount}`);
  console.log(`Skipped (no group info or group not found): ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error("Error during sync:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
