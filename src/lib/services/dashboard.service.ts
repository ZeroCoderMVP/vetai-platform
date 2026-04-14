import { prisma } from "@/lib/prisma";

export class DashboardService {
  /**
   * Retrieves high-level KPIs for the executive dashboard.
   */
  static async getExecutiveSummary(farmId?: string, periodDays: number = 7) {
    const whereFarm: any = farmId ? { id: farmId } : {};
    const whereCow: any = farmId ? { farmId } : {};
    const whereEvent: any = farmId ? { farmId } : {};
    
    // Date bounds
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - periodDays);

    const [
      totalCows, 
      dryCows, 
      eventsPeriod,
      operationsPending,
      operationsOverdue,
      operationsConfirmed,
      milkRecords
    ] = await Promise.all([
      prisma.cow.count({ where: { ...whereCow, status: 'active' } }),
      prisma.cow.count({ where: { ...whereCow, status: 'dry' } }),
      
      prisma.cowEvent.findMany({ 
        where: { 
          ...whereEvent, 
          eventDate: { gte: periodStart } 
        } 
      }),

      prisma.operationRequest.count({
        where: {
          ...(farmId && { farmId }),
          status: { in: ["CREATED", "PENDING_AFIMILK_ENTRY", "IN_PROGRESS", "NEEDS_VERIFICATION"] }
        }
      }),

      prisma.operationRequest.count({
        where: {
          ...(farmId && { farmId }),
          status: { notIn: ["VERIFIED", "CANCELLED", "REJECTED"] },
          dueDate: { lt: now }
        }
      }),

      prisma.operationRequest.count({
        where: {
          ...(farmId && { farmId }),
          status: "VERIFIED"
        }
      }),

      // getting today's milk yield approx
      prisma.milkRecord.aggregate({
        where: {
          date: { gte: new Date(now.setHours(0,0,0,0)) }
        },
        _sum: { yield: true }
      })
    ]);

    const milkingCows = totalCows - dryCows; // simplification
    const totalMilkPerDay = milkRecords._sum.yield || 0;
    const avgMilkPerCow = milkingCows > 0 ? totalMilkPerDay / milkingCows : 0;

    // Filter events
    const treatments7d = eventsPeriod.filter(e => e.eventType === "TREATMENT").length;
    const inseminations7d = eventsPeriod.filter(e => e.eventType === "INSEMINATION").length;

    // Approximating alerts as events with high severity
    const criticalAlerts = eventsPeriod.filter(e => {
      try {
        const meta = JSON.parse(e.metadata || "{}");
        return meta.severity === "CRITICAL";
      } catch { return false; }
    }).length;

    const confirmationRate = (operationsPending + operationsConfirmed) > 0 
      ? (operationsConfirmed / (operationsPending + operationsConfirmed)) * 100 
      : 0;

    return {
      population: {
        totalCows,
        milkingCows,
        dryCows,
        freshCows: 0 // Mocked for MVP
      },
      production: {
        avgMilkPerCow: Number(avgMilkPerCow.toFixed(1)),
        totalMilkPerDay: Number(totalMilkPerDay.toFixed(0)),
      },
      operations: {
        pendingOperations: operationsPending,
        overdueOperations: operationsOverdue,
        confirmationRate: Number(confirmationRate.toFixed(1))
      },
      events: {
        treatmentCount: treatments7d,
        inseminationCount: inseminations7d,
        criticalAlertCount: criticalAlerts,
        alertCount: eventsPeriod.length // Simplification
      }
    };
  }

  /**
   * Retrieves data for the main farm dashboard, extracting complex DB aggregation from the API route.
   */
  static async getMainDashboardData(startDate: Date, endDate: Date) {
    try {
      const feedRecords = await prisma.feedRecord.findMany({
        where: { date: { gte: startDate, lte: endDate } },
        orderBy: { date: "desc" },
      });

      let totalPlanned = 0;
      let totalActual = 0;
      let totalRemainder = 0;
      let totalDryMatter = 0;
      let totalIOFC = 0;
      let totalFeedCost = 0;
      let iofcCount = 0;
      let totalHeadCount = 0;
      let headCountEntries = 0;

      const groupMap: Record<string, {
        planned: number;
        actual: number;
        remainder: number;
        headCount: number;
        iofc: number;
        feedCost: number;
        groupType: string;
        count: number;
        groupId: string | null;
      }> = {};

      const dayMap: Record<string, { planned: number; actual: number; remainder: number; count: number; milkYield: number; eventCount: number }> = {};

      for (const r of feedRecords) {
        totalPlanned += r.planned || 0;
        totalActual += r.actual || 0;
        totalRemainder += r.remainder || 0;
        totalDryMatter += r.dryMatter || 0;

        if (r.iofc != null) {
          totalIOFC += r.iofc;
          iofcCount++;
        }
        if (r.feedCostPerHead != null) {
          totalFeedCost += r.feedCostPerHead;
        }
        if (r.headCount) {
          totalHeadCount += r.headCount;
          headCountEntries++;
        }

        const gn = r.groupName || "N/A";
        if (!groupMap[gn]) {
          groupMap[gn] = { planned: 0, actual: 0, remainder: 0, headCount: 0, iofc: 0, feedCost: 0, groupType: "", count: 0, groupId: null };
        }
        groupMap[gn].planned += r.planned || 0;
        groupMap[gn].actual += r.actual || 0;
        groupMap[gn].remainder += r.remainder || 0;
        if (r.headCount) groupMap[gn].headCount = r.headCount;
        if (r.iofc) groupMap[gn].iofc = r.iofc;
        if (r.feedCostPerHead) groupMap[gn].feedCost = r.feedCostPerHead;
        if (r.groupType) groupMap[gn].groupType = r.groupType;
        groupMap[gn].groupId = r.groupId || groupMap[gn].groupId;
        groupMap[gn].count++;

        const dateStr = r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0];
        if (!dayMap[dateStr]) dayMap[dateStr] = { planned: 0, actual: 0, remainder: 0, count: 0, milkYield: 0, eventCount: 0 };
        dayMap[dateStr].planned += r.planned || 0;
        dayMap[dateStr].actual += r.actual || 0;
        dayMap[dateStr].remainder += r.remainder || 0;
        dayMap[dateStr].count++;
      }

      const efficiency = totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 1000) / 10 : 0;
      const avgIOFC = iofcCount > 0 ? Math.round((totalIOFC / iofcCount) * 100) / 100 : null;

      let mixBatches: any[] = [];
      let ingredients: any[] = [];
      try {
        mixBatches = await (prisma as any).mixBatch.findMany({ 
           where: { date: { gte: startDate, lte: endDate } },
           orderBy: { date: "desc" }
        });
        ingredients = await (prisma as any).ingredientConsumption.findMany({ 
           where: { date: { gte: startDate, lte: endDate } } 
        });
      } catch {}

      let milkSummary = { totalYield: 0, avgYield: 0, cowCount: 0, recordCount: 0 };
      let milkRecords: any[] = [];
      try {
        milkRecords = await prisma.milkRecord.findMany({ 
           where: { date: { gte: startDate, lte: endDate } },
           orderBy: { date: "desc" }
        });
        const totalYield = milkRecords.reduce((sum, r) => sum + (r.yield || 0), 0);
        const cowSet = new Set(milkRecords.map((r) => r.cowNumber));
        milkSummary = {
          totalYield: Math.round(totalYield * 10) / 10,
          avgYield: cowSet.size > 0 ? Math.round((totalYield / cowSet.size) * 10) / 10 : 0,
          cowCount: cowSet.size,
          recordCount: milkRecords.length,
        };

        for (const r of milkRecords) {
          const dateStr = r.date instanceof Date ? r.date.toISOString().split("T")[0] : String(r.date).split("T")[0];
          if (!dayMap[dateStr]) dayMap[dateStr] = { planned: 0, actual: 0, remainder: 0, count: 0, milkYield: 0, eventCount: 0 };
          dayMap[dateStr].milkYield += (r.yield || 0);
        }
      } catch {}

      let recentEvents: any[] = [];
      try {
        recentEvents = await prisma.event.findMany({ 
           where: { timestamp: { gte: startDate, lte: endDate } },
           orderBy: { timestamp: "desc" }
        });

        for (const e of recentEvents) {
          const dateStr = e.timestamp instanceof Date ? e.timestamp.toISOString().split("T")[0] : String(e.timestamp).split("T")[0];
          if (!dayMap[dateStr]) dayMap[dateStr] = { planned: 0, actual: 0, remainder: 0, count: 0, milkYield: 0, eventCount: 0 };
          dayMap[dateStr].eventCount++;
        }
      } catch {}

      if (feedRecords.length === 0 && milkRecords.length === 0 && recentEvents.length === 0) {
        return {
          status: "no_data",
          feeding: {
            totalPlanned: 0,
            totalActual: 0,
            totalRemainder: 0,
            totalDryMatter: 0,
            efficiency: 0,
            avgIOFC: null,
            totalFeedCost: 0,
            totalHeadCount: 0,
            recordCount: 0,
            groupCount: 0,
          },
          milking: milkSummary,
          groups: [],
          daily: [],
          mixBatches: 0,
          ingredients: 0,
          events: [],
        };
      }

      const groups = Object.entries(groupMap)
        .map(([name, g]) => ({
          id: g.groupId,
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

      const daily = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({
          date,
          planned: Math.round(d.planned),
          actual: Math.round(d.actual),
          remainder: Math.round(d.remainder),
          milkYield: Math.round(d.milkYield * 10) / 10,
          eventCount: d.eventCount
        }));

      return {
        status: "ok",
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
      };
    } catch (error: any) {
      throw error;
    }
  }
}
