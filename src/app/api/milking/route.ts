import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const cowNumber = searchParams.get("cow");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "100");

  const where: any = {};

  // Фильтр по периоду
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59Z");
  }

  // Фильтр по корове
  if (cowNumber) {
    where.cowNumber = cowNumber;
  }

  try {
    const [records, total] = await Promise.all([
      prisma.milkRecord.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: true },
      }),
      prisma.milkRecord.count({ where }),
    ]);

    // Агрегаты за период (AIC - drill down)
    const aggregates = await prisma.milkRecord.aggregate({
      where,
      _sum: { yield: true },
      _avg: { yield: true, conductivity: true, scc: true },
      _count: true,
    });

    // Уникальные коровы (AIC)
    const uniqueCows = await prisma.milkRecord.groupBy({
      by: ["cowNumber"],
      where,
    });

    // Получаем валовый надой из AFI DAY_MILK за тот же период
    const afiWhere: any = {};
    if (from || to) {
      afiWhere.date = where.date;
    }
    if (cowNumber) {
      afiWhere.cowNumber = cowNumber;
    }
    
    let afiTotalYield = 0;
    let afiRecords: any[] = [];
    try {
      afiRecords = await prisma.afimilkDayMilk.findMany({
        where: afiWhere,
        orderBy: { date: "desc" },
      });
      afiTotalYield = afiRecords.reduce((sum, record) => sum + (record.actualTotal || 0), 0);
    } catch (e) {
      // Игнорируем ошибку, если таблицы нет
      console.warn("Could not fetch AFI Day Milk", e);
    }

    // Рассчитываем среднее дойное поголовье в день (cow-days / number of days)
    const uniqueDates = new Set(afiRecords.map(r => new Date(r.date).toISOString().split('T')[0])).size;
    const avgCowCount = uniqueDates > 0 
        ? Math.round(afiRecords.length / uniqueDates) 
        : uniqueCows.length;

    return NextResponse.json({
      status: total === 0 && afiTotalYield === 0 ? "no_data" : "ok",
      records,
      afiRecords,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalYield: Math.round((aggregates._sum.yield || 0) * 10) / 10,
        afiTotalYield: Math.round(afiTotalYield * 10) / 10,
        avgYield: Math.round((aggregates._avg.yield || 0) * 100) / 100,
        avgConductivity: Math.round((aggregates._avg.conductivity || 0) * 10) / 10,
        avgSCC: Math.round((aggregates._avg.scc || 0)),
        recordCount: aggregates._count,
        cowCount: avgCowCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
