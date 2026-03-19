import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getMockFarmData } from "@/lib/mockData";
import { getSystemDate } from "@/lib/systemDate";

const ALLOW_MOCK = process.env.VETAI_ALLOW_MOCK === "1";

function buildEmptyFarmResponse() {
  return {
    status: "no_data",
    kpi: {
      totalMilkToday: 0,
      averageMilkPerCow: 0,
      milkingCows: 0,
      milkDate: null,
      herdAlerts: 0,
      healthIssues: 0,
      heatSuspects: 0,
      toBreed: 0,
      calving: 0,
      freshCows: 0,
      mastitisSuspects: 0,
      ketosisSuspects: 0,
      abortionSuspects: 0,
      digestionProblems: 0,
      lastUpdate: null,
    },
    totalAnimals: 0,
    allCowNumbers: [],
    milkingRecords: [],
    milkingSummary: {
      date: null,
      totalYield: 0,
      averageYield: 0,
      totalCows: 0,
      bySCC: { normal: 0, elevated: 0, high: 0 },
      byConductivity: { normal: 0, warning: 0, critical: 0 },
    },
    afimilk: {
      healthIssues: { items: [] },
      heatSuspects: { items: [] },
      animalsToBreed: { items: [] },
      ketosisSuspects: { items: [] },
      mastitisSuspects: { items: [] },
      digestionProblems: { items: [] },
      freshCows: { items: [] },
      abortionSuspects: { items: [] },
      calvingAnimals: { items: [] },
    },
  };
}

export async function GET(request: NextRequest) {
  if (ALLOW_MOCK) {
    return NextResponse.json({ ...getMockFarmData(), status: "mock" });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

// ... existing code ...

    const today = getSystemDate();
    const thirtyDaysAgo = getSystemDate();
    thirtyDaysAgo.setDate(today.getDate() - 30);
  
    const startDate = fromParam ? new Date(fromParam) : today;
    const endDate = toParam ? new Date(toParam) : today;
    
    const startOfTargetDate = new Date(startDate);
    startOfTargetDate.setUTCHours(0, 0, 0, 0);
    const endOfTargetDate = new Date(endDate);
    endOfTargetDate.setUTCHours(23, 59, 59, 999);

    const [totalAnimals, allCowNumbersObj, milkRecords, events] = await Promise.all([
      prisma.cow.count(),
      prisma.cow.findMany({
        select: { number: true },
      }),
      prisma.milkRecord.findMany({
        where: {
          date: { gte: startOfTargetDate, lte: endOfTargetDate }
        },
        orderBy: { date: "desc" }
      }),
      prisma.event.findMany({
        where: { timestamp: { gte: startOfTargetDate, lte: endOfTargetDate } },
        orderBy: { timestamp: "desc" },
        include: { cow: true, group: true },
      }),
    ]);

    if (totalAnimals === 0 && milkRecords.length === 0 && events.length === 0) {
      return NextResponse.json(buildEmptyFarmResponse());
    }

    const eventCowIds = Array.from(new Set(events.filter(e => e.cowId).map(e => e.cowId as string)));
    const detailedCows = eventCowIds.length > 0 ? await prisma.cow.findMany({
        where: { id: { in: eventCowIds } },
        select: { id: true, number: true, lactation: true, dim: true, status: true, group: { select: { name: true } } },
    }) : [];

    const cowMap = new Map(detailedCows.map((cow) => [cow.number, cow]));

    const bySCC = { normal: 0, elevated: 0, high: 0 };
    const byConductivity = { normal: 0, warning: 0, critical: 0 };
    const validMilkRecords = milkRecords.filter((r) => r.cowNumber !== "0" && (r.yield || 0) > 0);
    for (const record of validMilkRecords) {
      if ((record.scc || 0) > 400) bySCC.high++;
      else if ((record.scc || 0) > 200) bySCC.elevated++;
      else bySCC.normal++;

      if ((record.conductivity || 0) >= 7.5) byConductivity.critical++;
      else if ((record.conductivity || 0) >= 6.5) byConductivity.warning++;
      else byConductivity.normal++;
    }

    const totalYield = validMilkRecords.reduce((sum, record) => sum + (record.yield || 0), 0);
    const uniqueMilkedCows = new Set(validMilkRecords.map((record) => record.cowNumber));

    const mkItems = () => ({ items: [] as any[] });
    const afimilk = {
      healthIssues: mkItems(),
      heatSuspects: mkItems(),
      animalsToBreed: mkItems(),
      ketosisSuspects: mkItems(),
      mastitisSuspects: mkItems(),
      digestionProblems: mkItems(),
      freshCows: mkItems(),
      abortionSuspects: mkItems(),
      calvingAnimals: mkItems(),
    };

    for (const event of events) {
      const cowNumber = event.cow?.number || "";
      if (!cowNumber) continue;

      const cow = cowMap.get(cowNumber);
      const normalized = {
        cow: cowNumber,
        cowId: event.cow?.id || cow?.id || null,
        group: Number(event.group?.name || cow?.group?.name || 0) || 0,
        lactationNumber: cow?.lactation || 0,
        dim: cow?.dim || 0,
        status: cow?.status || "active",
        gynStatus: cow?.status || "active",
        dailyAverageYield: null as number | null,
      };

      const t = `${event.title} ${event.description || ""}`.toLowerCase();
      if (t.includes("mastit")) afimilk.mastitisSuspects.items.push(normalized);
      else if (t.includes("ketos")) afimilk.ketosisSuspects.items.push(normalized);
      else if (t.includes("abort")) afimilk.abortionSuspects.items.push(normalized);
      else if (t.includes("digestion") || t.includes("пищевар")) afimilk.digestionProblems.items.push(normalized);
      else if (t.includes("breed") || t.includes("осемен")) afimilk.animalsToBreed.items.push(normalized);
      else if (t.includes("fresh") || t.includes("свеж")) afimilk.freshCows.items.push(normalized);
      else if (t.includes("calv") || t.includes("отел")) afimilk.calvingAnimals.items.push(normalized);
      else if (t.includes("heat") || t.includes("охот")) afimilk.heatSuspects.items.push(normalized);
      else afimilk.healthIssues.items.push(normalized);
    }

    return NextResponse.json({
      status: "ok",
      kpi: {
        totalMilkToday: Math.round(totalYield * 10) / 10,
        averageMilkPerCow: uniqueMilkedCows.size > 0 ? Math.round((totalYield / uniqueMilkedCows.size) * 10) / 10 : 0,
        milkingCows: uniqueMilkedCows.size,
        milkDate: validMilkRecords[0]?.date || null,
        herdAlerts: events.length,
        healthIssues: afimilk.healthIssues.items.length,
        heatSuspects: afimilk.heatSuspects.items.length,
        toBreed: afimilk.animalsToBreed.items.length,
        calving: afimilk.calvingAnimals.items.length,
        freshCows: afimilk.freshCows.items.length,
        mastitisSuspects: afimilk.mastitisSuspects.items.length,
        ketosisSuspects: afimilk.ketosisSuspects.items.length,
        abortionSuspects: afimilk.abortionSuspects.items.length,
        digestionProblems: afimilk.digestionProblems.items.length,
        lastUpdate: events[0]?.timestamp || validMilkRecords[0]?.date || null,
      },
      totalAnimals,
      allCowNumbers: Array.from(new Set(allCowNumbersObj.map((cow) => cow.number))).sort((a, b) => Number(a) - Number(b)),
      milkingRecords: validMilkRecords,
      milkingSummary: {
        date: validMilkRecords[0]?.date || null,
        totalYield: Math.round(totalYield * 10) / 10,
        averageYield: uniqueMilkedCows.size > 0 ? Math.round((totalYield / uniqueMilkedCows.size) * 10) / 10 : 0,
        totalCows: uniqueMilkedCows.size,
        bySCC,
        byConductivity,
      },
      afimilk,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
