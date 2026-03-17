import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const group = await prisma.groupUnit.findUnique({
      where: { id },
      include: {
        cows: {
          select: {
            id: true,
            number: true,
            status: true,
            dim: true,
            lactation: true,
          }
        },
        _count: {
          select: { cows: true, feedRecords: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ success: false, error: "Группа не найдена" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: group });
  } catch (error: any) {
    console.error(`Failed to fetch group ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
