import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMockDashboardData } from "@/lib/mockData";

// Установите VETAI_USE_REAL_DATA=1 чтобы использовать Prisma DB
const USE_REAL = process.env.VETAI_USE_REAL_DATA === '1';

export async function GET() {
  // По умолчанию: отдаём mock-данные для стабильного UI
  if (!USE_REAL) {
    return NextResponse.json(getMockDashboardData());
  }

  try {
    // Feed data aggregation  
    const feedRecords = await prisma.feedRecord.findMany({
      orderBy: { date: "desc" },
      take: 500,
    });

    let totalPlanned = 0, totalActual = 0, totalRemainder = 0, totalDryMatter = 0;
    let totalIOFC = 0, totalFeedCost = 0, iofcCount = 0;
    let totalHeadCount = 0, headCountEntries = 0;

    const groupMap: Record<string, { 
      planned: number; actual: number; remainder: number; 
      headCount: number; iofc: number; feedCost: number;
      groupType: string; count: number 
    }> = {};
    
    const dayMap: Record<string, { planned: number; actual: number; remainder: number; count: number }> = {};

    for (const r of feedRecords) {
      const rec = r as any;
      totalPlanned += rec.planned || 0;
      totalActual += rec.actual || 0;
      totalRemainder += rec.remainder || 0;
      totalDryMatter += rec.dryMatter || 0;

      if (rec.iofc != null) { totalIOFC += rec.iofc; iofcCount++; }
      if (rec.feedCostPerHead != null) { totalFeedCost += rec.feedCostPerHead; }
      if (rec.headCount) { totalHeadCount += rec.headCount; headCountEntries++; }

      // Group aggregation
      const gn = rec.groupName || "N/A";
      if (!groupMap[gn]) groupMap[gn] = { planned: 0, actual: 0, remainder: 0, headCount: 0, iofc: 0, feedCost: 0, groupType: "", count: 0 };
      groupMap[gn].planned += rec.planned || 0;
      groupMap[gn].actual += rec.actual || 0;
      groupMap[gn].remainder += rec.remainder || 0;
      if (rec.headCount) groupMap[gn].headCount = rec.headCount;
      if (rec.iofc) groupMap[gn].iofc = rec.iofc;
      if (rec.feedCostPerHead) groupMap[gn].feedCost = rec.feedCostPerHead;
      if (rec.groupType) groupMap[gn].groupType = rec.groupType;
      groupMap[gn].count++;

      // Daily aggregation
      const dateStr = r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0];
      if (!dayMap[dateStr]) dayMap[dateStr] = { planned: 0, actual: 0, remainder: 0, count: 0 };
      dayMap[dateStr].planned += rec.planned || 0;
      dayMap[dateStr].actual += rec.actual || 0;
      dayMap[dateStr].remainder += rec.remainder || 0;
      dayMap[dateStr].count++;
    }

    const efficiency = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0;
    const avgIOFC = iofcCount > 0 ? Math.round((totalIOFC / iofcCount) * 100) / 100 : null;

    // Mix batches
    const mixBatches = await (prisma as any).mixBatch.findMany({
      orderBy: { date: "desc" },
      take: 100,
    });

    // Ingredients
    const ingredients = await (prisma as any).ingredientConsumption.findMany({
      take: 100,
    });

    // Milk records (if available)
    let milkSummary = { totalYield: 0, avgYield: 0, cowCount: 0, recordCount: 0 };
    try {
      const milkRecords = await prisma.milkRecord.findMany({
        orderBy: { date: "desc" },
        take: 500,
      });
      const totalYield = milkRecords.reduce((sum, r) => sum + (r.yield || 0), 0);
      const cowSet = new Set(milkRecords.map(r => r.cowNumber));
      milkSummary = {
        totalYield: Math.round(totalYield * 10) / 10,
        avgYield: cowSet.size > 0 ? Math.round((totalYield / cowSet.size) * 10) / 10 : 0,
        cowCount: cowSet.size,
        recordCount: milkRecords.length,
      };
    } catch { /* No milk data */ }

    // Fallback: если нет реальных данных — отдаём mock
    if (feedRecords.length === 0 && milkSummary.recordCount === 0) {
      return NextResponse.json(getMockDashboardData());
    }

    // Events
    let recentEvents: any[] = [];
    try {
      recentEvents = await prisma.event.findMany({
        orderBy: { timestamp: "desc" },
        take: 20,
      });
    } catch { /* No events */ }

    // Groups for dashboard
    const groups = Object.entries(groupMap)
      .map(([name, g]) => ({
        name,
        planned: Math.round(g.planned),
        actual: Math.round(g.actual),
        remainder: Math.round(g.remainder),
        headCount: g.headCount,
        iofc: g.iofc ? Math.round(g.iofc * 100) / 100 : null,
        feedCost: g.feedCost ? Math.round(g.feedCost * 100) / 100 : null,
        groupType: g.groupType,
        efficiency: g.planned > 0 ? Math.round((g.actual / g.planned) * 1000) / 10 : 0,
        count: g.count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    // Daily data for charts
    const daily = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        planned: Math.round(d.planned),
        actual: Math.round(d.actual),
        remainder: Math.round(d.remainder),
      }));

    return NextResponse.json({
      feeding: {
        totalPlanned: Math.round(totalPlanned),
        totalActual: Math.round(totalActual),
        totalRemainder: Math.round(totalRemainder),
        totalDryMatter: Math.round(totalDryMatter),
        efficiency,
        avgIOFC,
        totalFeedCost: Math.round(totalFeedCost * 100) / 100,
        totalHeadCount: headCountEntries > 0 ? Math.round(totalHeadCount / headCountEntries) : 0,
        recordCount: feedRecords.length,
        groupCount: groups.length,
      },
      milking: milkSummary,
      groups,
      daily,
      mixBatches: mixBatches.length,
      ingredients: ingredients.length,
      events: recentEvents,
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
