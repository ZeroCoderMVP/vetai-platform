import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSystemDate } from "@/lib/systemDate";

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

    const sysDate = getSystemDate();
    const startDateObj = new Date(sysDate);
    startDateObj.setDate(startDateObj.getDate() - 30);
    
    // Fetch movements
    const histories = await prisma.cowSectionHistory.findMany({
      where: {
        OR: [
          { startDate: { gte: startDateObj } },
          { endDate: { gte: startDateObj } }
        ]
      },
      select: {
        sectionId: true,
        startDate: true,
        endDate: true,
      }
    });

    // matrix[sectionId][dateString] = { arrivals, departures }
    const matrix: Record<string, Record<string, { arrivals: number, departures: number }>> = {};
    
    barns.forEach(b => {
      b.sections.forEach(s => {
        matrix[s.id] = {};
      });
    });

    histories.forEach(h => {
      const sectionId = h.sectionId;
      if (!matrix[sectionId]) return;

      if (h.startDate >= startDateObj && h.startDate <= sysDate) {
        const dStr = h.startDate.toISOString().split("T")[0];
        if (!matrix[sectionId][dStr]) matrix[sectionId][dStr] = { arrivals: 0, departures: 0 };
        matrix[sectionId][dStr].arrivals++;
      }

      if (h.endDate && h.endDate >= startDateObj && h.endDate <= sysDate) {
         const dStr = h.endDate.toISOString().split("T")[0];
         if (!matrix[sectionId][dStr]) matrix[sectionId][dStr] = { arrivals: 0, departures: 0 };
         matrix[sectionId][dStr].departures++;
      }
    });

    return NextResponse.json({ 
       success: true, 
       data: barns, 
       timeline: matrix, 
       sysDate: sysDate.toISOString().split("T")[0] 
    });
  } catch (error: any) {
    console.error("Failed to fetch sections:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
