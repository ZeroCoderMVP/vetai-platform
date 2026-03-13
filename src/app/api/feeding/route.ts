import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupName = searchParams.get("group");

  const where: Record<string, any> = {};

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59Z");
  }

  if (groupName) {
    where.groupName = groupName;
  }

  try {
    // Записи кормления
    const records = await prisma.feedRecord.findMany({
      where,
      orderBy: { date: "desc" },
      take: 500,
    });

    // Агрегаты за период
    let totalPlanned = 0;
    let totalActual = 0;
    let totalRemainder = 0;
    let totalDryMatter = 0;
    let avgIOFC = 0;
    let avgFeedCostPerHead = 0;
    let iofcCount = 0;

    for (const r of records) {
      totalPlanned += (r as any).planned || 0;
      totalActual += (r as any).actual || 0;
      totalRemainder += (r as any).remainder || 0;
      totalDryMatter += (r as any).dryMatter || 0;
      if ((r as any).iofc != null) {
        avgIOFC += (r as any).iofc || 0;
        avgFeedCostPerHead += (r as any).feedCostPerHead || 0;
        iofcCount++;
      }
    }

    if (iofcCount > 0) {
      avgIOFC /= iofcCount;
      avgFeedCostPerHead /= iofcCount;
    }

    const efficiency = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;
    const remainderPercent = totalActual > 0 ? (totalRemainder / totalActual) * 100 : 0;

    // Группы — ручная агрегация
    const groupMap: Record<string, { planned: number; actual: number; remainder: number; count: number }> = {};
    for (const r of records) {
      const gn = (r as any).groupName || "N/A";
      if (!groupMap[gn]) groupMap[gn] = { planned: 0, actual: 0, remainder: 0, count: 0 };
      groupMap[gn].planned += (r as any).planned || 0;
      groupMap[gn].actual += (r as any).actual || 0;
      groupMap[gn].remainder += (r as any).remainder || 0;
      groupMap[gn].count++;
    }

    const groups = Object.entries(groupMap).map(([name, g]) => ({
      groupName: name,
      totalPlanned: Math.round(g.planned),
      totalActual: Math.round(g.actual),
      avgPlanned: g.count > 0 ? Math.round((g.planned / g.count) * 10) / 10 : 0,
      avgActual: g.count > 0 ? Math.round((g.actual / g.count) * 10) / 10 : 0,
      avgRemainder: g.count > 0 ? Math.round((g.remainder / g.count) * 10) / 10 : 0,
      recordCount: g.count,
      efficiency: g.planned > 0 ? Math.round((g.actual / g.planned) * 1000) / 10 : 0,
    }));

    // По дням
    const dayMap: Record<string, { planned: number; actual: number; remainder: number; count: number }> = {};
    for (const r of records) {
      const dateStr = r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0];
      if (!dayMap[dateStr]) dayMap[dateStr] = { planned: 0, actual: 0, remainder: 0, count: 0 };
      dayMap[dateStr].planned += (r as any).planned || 0;
      dayMap[dateStr].actual += (r as any).actual || 0;
      dayMap[dateStr].remainder += (r as any).remainder || 0;
      dayMap[dateStr].count++;
    }

    const daily = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        planned: Math.round(d.planned),
        actual: Math.round(d.actual),
        remainder: Math.round(d.remainder),
        avgIOFC: 0,
        count: d.count,
      }));

    return NextResponse.json({
      records,
      summary: {
        totalPlanned: Math.round(totalPlanned),
        totalActual: Math.round(totalActual),
        totalRemainder: Math.round(totalRemainder),
        totalDryMatter: Math.round(totalDryMatter),
        efficiency: Math.round(efficiency * 10) / 10,
        remainderPercent: Math.round(remainderPercent * 10) / 10,
        avgIOFC: Math.round(avgIOFC * 100) / 100,
        avgFeedCostPerHead: Math.round(avgFeedCostPerHead * 100) / 100,
        recordCount: records.length,
        groupCount: groups.length,
      },
      groups,
      daily,
    });
  } catch (error: any) {
    console.error("Feeding API error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack?.substring(0, 500) }, { status: 500 });
  }
}
