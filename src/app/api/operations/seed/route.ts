import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    let farm = await prisma.farm.findFirst({ orderBy: { createdAt: 'asc' }});
    if (!farm) {
      farm = await prisma.farm.create({ data: { name: "АО «Гатчинское»" } });
    }

    let barn = await prisma.barn.findFirst({ where: { farmId: farm.id }});
    if (!barn) {
      barn = await prisma.barn.create({ data: { name: "Двор №1", farmId: farm.id } });
    }

    let cow1 = await prisma.cow.findFirst({ where: { farmId: farm.id }});
    if (!cow1) {
      cow1 = await prisma.cow.create({ 
        data: { 
          number: "8055", 
          farmId: farm.id, 
          barnId: barn.id, 
          status: "active" 
        } 
      });
    }

    let count = 0;
    
    // Create pending operation
    await prisma.operationRequest.create({
      data: {
        farmId: farm.id,
        barnId: barn?.id || null,
        cowId: cow1.id,
        operationType: "TREATMENT",
        title: "Лечение мастита (Квартет)",
        description: "Необходимо внести в AfiMilk лечение мастита препаратом Квартет. Курс 3 дня.",
        eventDate: new Date(),
        dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24), // tomorrow
        priority: "HIGH",
        status: "PENDING_AFIMILK_ENTRY",
        isCriticalForVeterinary: true,
        createdById: "system",
        statusHistory: {
          create: {
            newStatus: "PENDING_AFIMILK_ENTRY",
            changedById: "system"
          }
        }
      }
    });
    count++;

    // Create overdue operation
    await prisma.operationRequest.create({
      data: {
        farmId: farm.id,
        cowId: cow1.id,
        operationType: "INSEMINATION",
        title: "Осеменение (симментал)",
        description: "Внести факт осеменения. Семя: Симментал бык Бархан.",
        eventDate: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24), // yesterday
        priority: "CRITICAL",
        status: "OVERDUE",
        isCriticalForReproduction: true,
        createdById: "system",
        statusHistory: {
          create: {
            newStatus: "OVERDUE",
            changedById: "system"
          }
        }
      }
    });
    count++;

    // Create completed operation
    const op3 = await prisma.operationRequest.create({
      data: {
        farmId: farm.id,
        cowId: cow1.id,
        operationType: "GROUP_TRANSFER",
        title: "Перевод в сухостой",
        eventDate: new Date(Date.now() - 1000 * 60 * 60 * 72),
        dueDate: new Date(Date.now() - 1000 * 60 * 60 * 48),
        priority: "MEDIUM",
        status: "VERIFIED",
        confirmedAt: new Date(Date.now() - 1000 * 60 * 60 * 50),
        confirmedById: "manager_1",
        createdById: "system",
      }
    });
    
    await prisma.operationConfirmation.create({
      data: {
        operationRequestId: op3.id,
        confirmedById: "manager_1",
        confirmedAt: new Date(),
        confirmationMethod: "MANUAL",
        note: "Внесено в AfiMilk успешно."
      }
    });
    count++;

    return NextResponse.json({ success: true, seeded: count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
