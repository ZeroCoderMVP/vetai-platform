import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { action, newCowNumber, newNotes } = await request.json(); 
    // action: "RESOLVE" | "DELETE"

    if (action === "DELETE") {
        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ success: true, deleted: true });
    }

    // Применяем изменения
    let cowId = undefined;
    if (newCowNumber) {
        const cow = await prisma.cow.findFirst({
            where: { number: newCowNumber }
        });
        if (cow) {
            cowId = cow.id;
        } else {
            // Если ввел корову которой нет - пока ругаемся
            return NextResponse.json({ error: `Корова ${newCowNumber} не найдена` }, { status: 400 });
        }
    }

    const updated = await prisma.event.update({
      where: { id },
      data: { 
        confirmationStatus: "CONFIRMED_HUMAN",
        confirmedAt: new Date(),
        ...(cowId !== undefined && { cowId }),
        ...(newNotes && { description: newNotes })
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
