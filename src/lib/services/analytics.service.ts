import { prisma } from "@/lib/prisma";

export class AnalyticsService {
  /**
   * Retrieves milk trend for the given period
   */
  static async getMilkTrend(farmId?: string, periodDays: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const records = await prisma.feedRecord.findMany({
      where: {
        date: { gte: startDate }
      },
      select: {
        date: true,
        milkYield: true,
        headCount: true,
        groupType: true,
      },
      orderBy: { date: 'asc' }
    });

    // Aggregate by day
    const trendMap = new Map<string, { milk: number, cows: number }>();
    
    records.forEach(r => {
      const day = r.date.toISOString().split('T')[0];
      if (!trendMap.has(day)) trendMap.set(day, { milk: 0, cows: 0 });
      
      const current = trendMap.get(day)!;
      current.milk += (r.milkYield || 0);
      
      // Count milking cows (not exact, using group estimates if available)
      if (r.groupType !== 'Сухостой') {
        current.cows += (r.headCount || 0);
      }
    });

    return Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      totalYield: data.milk,
      avgPerCow: data.cows > 0 ? parseFloat((data.milk / data.cows).toFixed(1)) : 0
    }));
  }
}
