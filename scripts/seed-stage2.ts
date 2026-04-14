import prisma from "../src/lib/prisma";

async function main() {
  console.log("Seeding Stage 2 data (Inbox, Conflicts, Outbox)...");

  // Get Farm
  let farm = await prisma.farm.findFirst();
  if (!farm) {
    farm = await prisma.farm.create({ data: { name: "Заря" } });
  }

  // Get DataSources
  let afiSource = await prisma.dataSource.findFirst({ where: { name: "afimilk" } });
  if (!afiSource) {
    afiSource = await prisma.dataSource.create({
      data: { name: "afimilk", type: "api", status: "active" }
    });
  }

  let dtmSource = await prisma.dataSource.findFirst({ where: { name: "dtm" } });
  if (!dtmSource) {
    dtmSource = await prisma.dataSource.create({
      data: { name: "dtm", type: "api", status: "active" }
    });
  }

  let mobileSource = await prisma.dataSource.findFirst({ where: { name: "mobile" } });
  if (!mobileSource) {
    mobileSource = await prisma.dataSource.create({
      data: { name: "mobile", type: "api", status: "active" }
    });
  }

  let videoSource = await prisma.dataSource.findFirst({ where: { name: "video_ai" } });
  if (!videoSource) {
    videoSource = await prisma.dataSource.create({
      data: { name: "video_ai", type: "video", status: "active" }
    });
  }

  // Get some cows
  const cows = await prisma.cow.findMany({ take: 3 });
  if (cows.length === 0) {
    console.error("No cows found! Run normal seed first.");
    return;
  }

  // 1. Create UNCONFIRMED events (for Inbox)
  console.log("Creating UNCONFIRMED events...");
  await prisma.event.create({
    data: {
      farmId: farm.id,
      cowId: cows[0].id,
      title: "Визуальный осмотр",
      description: "Животное прихрамывает",
      severity: "warning",
      timestamp: new Date(),
      source: "mobile",
      confirmationStatus: "UNCONFIRMED",
      metadata: JSON.stringify({ deviceId: "tablet-01", notes: "Требует расчистку" }),
      dedupeKey: `lameness_${cows[0].id}_${Date.now()}`
    }
  });

  await prisma.event.create({
    data: {
      farmId: farm.id,
      cowId: cows[1].id,
      title: "Лечение: Мастит",
      description: "Введен препарат Мультимаст",
      severity: "info",
      timestamp: new Date(),
      source: "mobile",
      confirmationStatus: "UNCONFIRMED",
      metadata: JSON.stringify({ doctor: "Сидоров В.М." }),
      dedupeKey: `treatment_${cows[1].id}_${Date.now()}`
    }
  });

  // 2. Create CONFLICT events (for Conflicts page)
  console.log("Creating CONFLICT events...");
  const dedupeKey = `calving_${cows[2].id}_conflict`;
  
  // Clean up old conflicts to avoid unique errors if re-run
  await prisma.event.deleteMany({
    where: { dedupeKey: dedupeKey }
  });

  await prisma.event.create({
    data: {
      farmId: farm.id,
      cowId: cows[2].id,
      title: "Отёл (Видеоаналитика)",
      description: "Видеофиксация: Обнаружено появление 2 телят в зоне родильного отделения.",
      severity: "info",
      timestamp: new Date(Date.now() - 3600*1000), // 1 hour ago
      source: "video_ai",
      confirmationStatus: "CONFLICT",
      metadata: JSON.stringify({ calvesCount: 2, confidenceScore: 0.94 }),
      dedupeKey: dedupeKey,
    }
  });

  await prisma.event.create({
    data: {
      farmId: farm.id,
      cowId: cows[2].id,
      title: "Отёл (Ручной ввод)",
      description: "Один теленок, легкий отел",
      severity: "warning",
      timestamp: new Date(Date.now() - 4000*1000), // ~1.1 hour ago
      source: "mobile",
      confirmationStatus: "CONFLICT",
      metadata: JSON.stringify({ calvesCount: 1, calfWeight: 38, ease: 1 }),
      dedupeKey: dedupeKey,
    }
  });

  // 3. Create OutboxMessages (for Outbox page)
  console.log("Creating OutboxMessages...");
  await prisma.outboxMessage.create({
    data: {
      farmId: farm.id,
      dataSourceId: afiSource.id,
      payloadJson: JSON.stringify({ action: "UPDATE_STATUS", cowId: cows[0].afiId, status: "DRY" }),
      status: "FAILED",
      errorMessage: "AfiFarm API Error: Timeout exceeding 5000ms",
      attempts: 3,
      lastAttemptAt: new Date(Date.now() - 600000), // 10 mins ago
      nextRetryAt: new Date(Date.now() + 600000), // 10 mins from now
    }
  });

  await prisma.outboxMessage.create({
    data: {
      farmId: farm.id,
      dataSourceId: afiSource.id,
      payloadJson: JSON.stringify({ action: "ADD_EVENT", cowId: cows[1].afiId, eventType: "INSEMINATION" }),
      status: "PENDING",
      attempts: 0,
      nextRetryAt: new Date(),
    }
  });

  await prisma.outboxMessage.create({
    data: {
      farmId: farm.id,
      dataSourceId: dtmSource.id,
      payloadJson: JSON.stringify({ action: "UPDATE_RECIPE", code: "MILK_01", totalHead: 140 }),
      status: "ACKNOWLEDGED",
      externalAckId: "DTM-TX-998211",
      attempts: 1,
      lastAttemptAt: new Date(Date.now() - 3600000),
    }
  });

  console.log("Stage 2 Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
