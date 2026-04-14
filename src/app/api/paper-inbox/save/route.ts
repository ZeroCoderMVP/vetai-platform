import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { events } = await request.json();

    if (!events || !Array.isArray(events)) {
        return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const savedEvents = [];

    for (const evt of events) {
      // Ищем животное по номеру бирки
      let cowId = null;
      if (evt.cowNumber && !evt.cowNumber.includes("?")) {
        // Ищем корову по number (вместо farmTag, которого нет в схеме)
        const cow = await prisma.cow.findFirst({
            where: { number: evt.cowNumber }
        });
        
        if (cow) {
            cowId = cow.id;
        }
      }

      // Сохраняем событие (Оно подтверждено человеком на этапе проверки)
      const newEvent = await prisma.event.create({
        data: {
            title: cowId ? evt.eventType : `[Без ID Животного] ${evt.eventType}`,
            description: evt.notes,
            timestamp: new Date(evt.date),
            source: "paper",
            cowId: cowId,
            confirmationStatus: "CONFIRMED_HUMAN",
            confirmedAt: new Date(),
            confidenceScore: evt.confidenceScore / 100,
            metadata: JSON.stringify({ originalOcrText: evt.notes, scannedCowNumber: evt.cowNumber, manualVerification: true })
        }
      });

      savedEvents.push(newEvent);
    }

    return NextResponse.json({ success: true, count: savedEvents.length, savedEvents });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
