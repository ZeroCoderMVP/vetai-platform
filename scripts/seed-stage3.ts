import prisma from "../src/lib/prisma";

async function main() {
  console.log("Seeding Stage 3 Tasks...");

  const farm = await prisma.farm.findFirst();
  if (!farm) {
    console.error("No farm found.");
    return;
  }

  const cows = await prisma.cow.findMany({ take: 3 });
  if (cows.length < 2) {
    console.error("Not enough cows.");
    return;
  }

  await prisma.task.create({
    data: {
      farmId: farm.id,
      title: "Осмотр на хромоту",
      description: "Животное прихрамывает на левую заднюю ногу. Необходимо подрезать копыто.",
      status: "TODO",
      priority: "HIGH",
      dueDate: new Date(Date.now() + 86400 * 1000), // tomorrow
      assigneeId: "Ветврач Иванов",
      cowId: cows[0].id
    }
  });

  await prisma.task.create({
    data: {
      farmId: farm.id,
      title: "Взять кровь на анализ",
      description: "Подозрение на кетоз по результатам надоя.",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      dueDate: new Date(Date.now() - 3600 * 1000), // overdue by 1 hour
      assigneeId: "Ветврач Иванов",
      cowId: cows[1].id
    }
  });

  await prisma.task.create({
    data: {
      farmId: farm.id,
      title: "Замена кормушки",
      description: "В секции 1А сломана поилка.",
      status: "DONE",
      priority: "MEDIUM",
      assigneeId: "Инженер Сидоров"
    }
  });

  console.log("Tasks seeded!");
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
