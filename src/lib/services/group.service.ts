import prisma from "@/lib/prisma";
import { format, addDays } from "date-fns";

export class GroupService {
  /**
   * Retrieves feeding and milking statistics for a specific group within a date range.
   */
  static async getGroupStats(groupId: string, fromDate: Date, toDate: Date) {
    try {
      const group = await prisma.groupUnit.findUnique({ where: { id: groupId } });
      if (!group) return null; // Indicator of not found

      // Initialize daily map
      const dailyStatsMap = new Map<string, { date: string, feed: number, milk: number, cowDays: number, feedHeadDays: number }>();
      let currentD = new Date(fromDate);
      while (currentD <= toDate) {
        const dateStr = format(currentD, "yyyy-MM-dd");
        dailyStatsMap.set(dateStr, { date: dateStr, feed: 0, milk: 0, cowDays: 0, feedHeadDays: 0 });
        currentD = addDays(currentD, 1);
      }

      // 1. Fetch FeedRecords for this group in period
      const feedRecords = await prisma.feedRecord.findMany({
        where: {
          groupId: groupId,
          date: { gte: fromDate, lte: toDate },
        }
      });

      let totalFeed = 0;
      let sumOfFeedHeadCounts = 0;
      for (const r of feedRecords) {
          totalFeed += (r.actual || 0);
          sumOfFeedHeadCounts += (r.headCount || 0);
          
          const dateStr = format(r.date, "yyyy-MM-dd");
          const daily = dailyStatsMap.get(dateStr);
          if (daily) {
              daily.feed += (r.actual || 0);
              daily.feedHeadDays += (r.headCount || group.headCount);
          }
      }

      // 2. Resolve historical group membership for milk yield
      const cowsRelated = await prisma.cow.findMany({
        where: {
          OR: [
            { groupId: groupId },
            { events: { some: { groupId: groupId } } }
          ]
        },
        select: { id: true, groupId: true, number: true }
      });
      
      const cowIds = cowsRelated.map(c => c.id);

      const milkRecords = await prisma.afimilkDayMilk.findMany({
        where: {
          date: { gte: fromDate, lte: toDate },
          cowId: { in: cowIds }
        }
      });

      const groupEvents = await prisma.event.findMany({
        where: {
          cowId: { in: cowIds },
          groupId: { not: null },
          timestamp: { lte: toDate }
        },
        orderBy: { timestamp: 'asc' },
        select: { cowId: true, groupId: true, timestamp: true }
      });

      const eventsByCow: Record<string, typeof groupEvents> = {};
      for (const e of groupEvents) {
          if (!e.cowId) continue;
          if (!eventsByCow[e.cowId]) eventsByCow[e.cowId] = [];
          eventsByCow[e.cowId].push(e);
      }

      let totalMilk = 0;
      let cowDays = 0;

      for (const record of milkRecords) {
         if (!record.cowId) continue;
         const cowEvents = eventsByCow[record.cowId] || [];
         
         let latestEventGroupId: string | null = null;
         for (let i = cowEvents.length - 1; i >= 0; i--) {
             if (cowEvents[i].timestamp <= record.date) {
                 latestEventGroupId = cowEvents[i].groupId;
                 break;
             }
         }

         const currentCow = cowsRelated.find(c => c.id === record.cowId);
         const effectiveGroupId = latestEventGroupId || (currentCow?.groupId || null);

         if (effectiveGroupId === groupId) {
             totalMilk += (record.actualTotal || 0);
             cowDays += 1;
             
             const dateStr = format(record.date, "yyyy-MM-dd");
             const daily = dailyStatsMap.get(dateStr);
             if (daily) {
                 daily.milk += (record.actualTotal || 0);
                 daily.cowDays += 1;
             }
         }
      }
      
      const avgYieldPerHead = cowDays > 0 ? totalMilk / cowDays : 0;
      const totalFeedHeadDays = sumOfFeedHeadCounts > 0 ? sumOfFeedHeadCounts : (group.headCount * feedRecords.length);
      
      const avgFeedPerHead = totalFeedHeadDays > 0 ? totalFeed / totalFeedHeadDays : 0;
      const feedPerKgMilk = totalMilk > 0 ? totalFeed / totalMilk : 0;

      // Format daily array
      const dailyArray = Array.from(dailyStatsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

      return {
          totalFeed,
          totalMilk,
          avgYieldPerHead,
          avgFeedPerHead,
          feedPerKgMilk,
          cowDaysInPeriod: cowDays,
          feedRecordsCount: feedRecords.length,
          daily: dailyArray
      };
    } catch (error) {
      throw error;
    }
  }
}
