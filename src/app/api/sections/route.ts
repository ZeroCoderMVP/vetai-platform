import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const barns = await prisma.barn.findMany({
      include: {
        sections: {
          include: {
            _count: {
              select: { currentCows: true },
            },
          },
        },
        _count: {
          select: { cows: true },
        },
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ success: true, data: barns });
  } catch (error: any) {
    console.error("Failed to fetch sections:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
