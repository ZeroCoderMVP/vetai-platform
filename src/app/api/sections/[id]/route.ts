import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSystemDate } from "@/lib/systemDate";

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

    // 1. Fetch recent movements for analytics
    const systemDate = getSystemDate();
    const thirtyDaysAgo = new Date(systemDate);
    thirtyDaysAgo.setDate(systemDate.getDate() - 30);

    // Arrivals (started living here in last 30 days)
    const arrivals = await prisma.cowSectionHistory.findMany({
      where: {
        sectionId: id,
        startDate: { gte: thirtyDaysAgo, lte: systemDate }
      },
      include: {
        cow: { select: { id: true, number: true, status: true } }
      },
      orderBy: { startDate: "desc" },
      take: 20
    });

    // Departures (left here in last 30 days)
    const departures = await prisma.cowSectionHistory.findMany({
      where: {
        sectionId: id,
        endDate: { gte: thirtyDaysAgo, lte: systemDate }
      },
      include: {
        cow: { select: { id: true, number: true, status: true } }
      },
      orderBy: { endDate: "desc" },
      take: 20
    });

    const enrichedSection = {
      ...section,
      recentMovements: {
        arrivals: arrivals.map(a => ({
          cowId: a.cow.id,
          number: a.cow.number,
          status: a.cow.status,
          date: a.startDate.toISOString()
        })),
        departures: departures.map(d => ({
          cowId: d.cow.id,
          number: d.cow.number,
          status: d.cow.status,
          date: d.endDate?.toISOString()
        })),
      }
    };

    return NextResponse.json({ success: true, data: enrichedSection });
  } catch (error: any) {
    console.error(`Failed to fetch section ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
