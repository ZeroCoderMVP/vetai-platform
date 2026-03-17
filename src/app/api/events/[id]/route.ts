import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        cow: true,
        group: true,
      },
    });

    if (!event) {
      return NextResponse.json({ success: false, error: "Событие не найдено" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: event });
  } catch (error: any) {
    console.error("Event fetch error:", error);
    return NextResponse.json({ success: false, error: "Ошибка сервера" }, { status: 500 });
  }
}
