import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get("date");
    
    let targetDate = new Date();
    if (dateParam) targetDate = new Date(dateParam);
    
    const startOfDay = new Date(targetDate);
    startOfDay.setUTCHours(0,0,0,0);
    const endOfDay = new Date(targetDate);
    endOfDay.setUTCHours(23,59,59,999);

    const tasks = await prisma.operationRequest.findMany({
      where: {
        eventDate: { gte: startOfDay, lte: endOfDay }
      },
      include: {
        cow: { select: { number: true, group: { select: { name: true } } } },
        farm: { select: { name: true } }
      }
    });
    
    // Use the exact AfiMilk control module categories
    const grouped = {
      TREATMENT: [] as any[],
      INSEMINATION: [] as any[],
      VACCINATION: [] as any[],
      HOOF_TRIM: [] as any[]
    };
    
    const stats = {
      TREATMENT: { total: 0, completed: 0, percent: 0 },
      INSEMINATION: { total: 0, completed: 0, percent: 0 },
      VACCINATION: { total: 0, completed: 0, percent: 0 },
      HOOF_TRIM: { total: 0, completed: 0, percent: 0 }
    };
    
    const statusOrder: Record<string, number> = { "CREATED": 1, "IN_PROGRESS": 2, "COMPLETED": 3, "CANCELLED": 4 };
    
    tasks.sort((a, b) => {
       if (statusOrder[a.status] !== statusOrder[b.status]) return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
       return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    for (const t of tasks) {
      const type = t.operationType as keyof typeof grouped;
      if (grouped[type]) {
        grouped[type].push(t);
        stats[type].total++;
        if (t.status === "COMPLETED") stats[type].completed++;
      }
    }
    
    for (const k of Object.keys(stats)) {
      const key = k as keyof typeof stats;
      stats[key].percent = stats[key].total > 0 ? Math.round((stats[key].completed / stats[key].total) * 100) : 0;
    }

    return NextResponse.json({ success: true, tasks: grouped, stats });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;
    
    if (!id || !status) {
      return NextResponse.json({ success: false, error: "Missing id or status" }, { status: 400 });
    }
    
    const updated = await prisma.operationRequest.update({
      where: { id },
      data: {
        status,
        ...(status === "COMPLETED" ? { confirmedAt: new Date() } : { confirmedAt: null })
      }
    });
    
    return NextResponse.json({ success: true, task: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
