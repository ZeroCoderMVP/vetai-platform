import prisma from "../src/lib/prisma";
import { format, addDays, startOfDay, endOfDay, parseISO } from "date-fns";

async function main() {
  const groups = await prisma.groupUnit.findMany({ where: { isActive: true } });
  
  const fromStr = "2024-03-01";
  const toStr = "2024-03-15";
  const fromDate = startOfDay(parseISO(fromStr));
  const toDate = endOfDay(parseISO(toStr));
  
  console.log("From:", fromDate);
  console.log("To:", toDate);

  for (const group of groups) {
     const dailyStatsMap = new Map<string, any>();
     let currentD = new Date(fromDate);
     while (currentD <= toDate) {
       const dateStr = format(currentD, "yyyy-MM-dd");
       dailyStatsMap.set(dateStr, { date: dateStr, feed: 0, milk: 0, cowDays: 0, feedHeadDays: 0 });
       currentD = addDays(currentD, 1);
     }

     const cowsRelated = await prisma.cow.findMany({
        where: { OR: [ { groupId: group.id }, { events: { some: { groupId: group.id } } } ] },
        select: { id: true, groupId: true, number: true }
      });
      const cowIds = cowsRelated.map((c: any) => c.id);
      const milkRecords = await prisma.afimilkDayMilk.findMany({
        where: { date: { gte: fromDate, lte: toDate }, cowId: { in: cowIds } }
      });

     let totalMilk = 0;
     let matchCount = 0;
     let missCount = 0;
     for (const record of milkRecords) {
         if (!record.cowId) continue;
         totalMilk += record.actualTotal || 0;
         const dateStr = format(record.date, "yyyy-MM-dd");
         const daily = dailyStatsMap.get(dateStr);
         if (daily) {
             daily.milk += (record.actualTotal || 0);
             matchCount++;
         } else {
             missCount++;
             console.log("Missed date mapping:", record.date, "=>", dateStr);
         }
     }
     
     if (totalMilk > 0) {
         const dailyArray = Array.from(dailyStatsMap.values());
         console.log("Group", group.name, group.id);
         console.log("Total Milk", totalMilk);
         console.log("Matches:", matchCount, "Misses:", missCount);
         console.log(dailyArray.slice(0, 3));
         break;
     }
  }
}

main().catch(console.error);
