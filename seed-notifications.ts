import { prisma } from './src/lib/prisma';

async function main() {
  console.log("Seeding notifications...");

  // Delete existing
  await prisma.notification.deleteMany();

  // Create mock notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: "system",
        title: "Критическое падение надоев",
        message: "В группе 4 (Первотёлки) зафиксировано падение надоев на 15% по сравнению со вчерашним днём.",
        type: "action_required",
        priority: "critical",
        sourceType: "Группа 4",
        sourceId: "grp-4",
        link: "/groups/4",
        isRead: false,
        isActionable: true,
        status: "unread"
      },
      {
        userId: "system",
        title: "Отчёт сформирован с ошибками",
        message: "Месячный управленческий отчёт за февраль сгенерирован, но содержит 2 ошибки валидации (Отсутствуют данные DTM).",
        type: "report_alert",
        priority: "high",
        sourceType: "Управленческий отчёт",
        sourceId: "rpt-1",
        link: "/reporting/instances/mock-1",
        isRead: false,
        isActionable: true,
        status: "unread"
      },
      {
        userId: "system",
        title: "Корова #4512 — Подозрение на мастит",
        message: "Электропроводность молока превысила порог на 28% во время утренней дойки.",
        type: "action_required",
        priority: "high",
        sourceType: "Корова #4512",
        sourceId: "4512",
        link: "/health",
        isRead: true,
        isActionable: true,
        status: "in_progress"
      },
      {
        userId: "system",
        title: "Импорт из Afimilk завершен",
        message: "Обработано 950 записей. Создано 12 новых событий охоты.",
        type: "system_alert",
        priority: "info",
        sourceType: "Интеграция",
        link: "/events",
        isRead: false,
        isActionable: false,
        status: "unread"
      },
      {
        userId: "system",
        title: "Утренний бриф готов",
        message: "Сводка за прошедшие сутки успешно сгенерирована и отправлена на email.",
        type: "report_alert",
        priority: "low",
        sourceType: "Отчёт",
        link: "/reporting/instances/mock-2",
        isRead: false,
        isActionable: false,
        status: "unread"
      }
    ]
  });

  console.log("Finished seeding notifications.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
