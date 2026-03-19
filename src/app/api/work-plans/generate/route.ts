import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST() {
  try {
    const activeFarm = await prisma.farm.findFirst();
    if (!activeFarm) {
      return NextResponse.json({ success: false, error: "No farm found" }, { status: 404 });
    }

    const cows = await prisma.cow.findMany({
      where: { status: "active" },
      take: 40,
    });

    if (cows.length === 0) {
      return NextResponse.json({ success: false, error: "No active cows found" }, { status: 404 });
    }

    const today = new Date();
    today.setUTCHours(12, 0, 0, 0);

    const priorities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
    
    // Clear old tasks for today
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23,59,59,999);
    
    await prisma.operationRequest.deleteMany({
      where: { eventDate: { gte: startOfDay, lte: endOfDay } }
    });

    const requests = [];

    // Treatments
    for (let i = 0; i < 12; i++) {
        const cow = cows[Math.floor(Math.random() * cows.length)];
        const issues = ["Мастит (вымя)", "Хромота (конечности)", "Кетоз (ЖКТ)", "Эндометрит (воспроизводство)"];
        requests.push({
            farmId: activeFarm.id,
            cowId: cow.id,
            operationType: "TREATMENT",
            status: Math.random() > 0.7 ? "COMPLETED" : "CREATED",
            priority: priorities[Math.floor(Math.random() * 2) + 2], // HIGH | CRITICAL
            eventDate: today,
            dueDate: today,
            title: issues[Math.floor(Math.random() * issues.length)],
            description: "Плановый осмотр и курс антибиотиков",
            createdById: "system_generator"
        });
    }

    // Reproduction
    for (let i = 0; i < 8; i++) {
        const cow = cows[Math.floor(Math.random() * cows.length)];
        const actions = ["Проверка стельности", "Запуск (перевод в сухостой)", "Планируемый отёл", "Осеменение"];
        requests.push({
            farmId: activeFarm.id,
            cowId: cow.id,
            operationType: "REPRODUCTION",
            status: Math.random() > 0.5 ? "COMPLETED" : "CREATED",
            priority: "MEDIUM",
            eventDate: today,
            dueDate: today,
            title: actions[Math.floor(Math.random() * actions.length)],
            createdById: "system_generator"
        });
    }

    // Vaccination
    for (let i = 0; i < 10; i++) {
        const cow = cows[Math.floor(Math.random() * cows.length)];
        requests.push({
            farmId: activeFarm.id,
            cowId: cow.id,
            operationType: "VACCINATION",
            status: Math.random() > 0.3 ? "COMPLETED" : "CREATED",
            priority: "LOW",
            eventDate: today,
            dueDate: today,
            title: "Плановая вакцинация против ВРК",
            createdById: "system_generator"
        });
    }

    // Hoof
    for (let i = 0; i < 15; i++) {
        const cow = cows[Math.floor(Math.random() * cows.length)];
        requests.push({
            farmId: activeFarm.id,
            cowId: cow.id,
            operationType: "HOOF_TRIMMING",
            status: Math.random() > 0.8 ? "COMPLETED" : "CREATED",
            priority: "MEDIUM",
            eventDate: today,
            dueDate: today,
            title: "Функциональная обрезка копыт",
            createdById: "system_generator"
        });
    }

    await prisma.operationRequest.createMany({ data: requests });

    return NextResponse.json({ success: true, count: requests.length });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
