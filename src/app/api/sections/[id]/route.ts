import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  try {
    const section = await prisma.section.findUnique({
      where: { id },
      include: {
        currentCows: {
          select: {
            id: true,
            number: true,
            status: true,
            lactation: true,
            dim: true,
            group: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        barn: {
          select: {
            id: true,
            name: true,
            farm: {
              select: {
                name: true,
              }
            }
          }
        },
        _count: {
          select: { currentCows: true },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ success: false, error: "Секция не найдена" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: section });
  } catch (error: any) {
    console.error(`Failed to fetch section ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
