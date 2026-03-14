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

    // Агрегаты за период
    const aggregates = await prisma.milkRecord.aggregate({
      where,
      _sum: { yield: true },
      _avg: { yield: true, conductivity: true, scc: true },
      _count: true,
    });

    // Уникальные коровы
    const uniqueCows = await prisma.milkRecord.groupBy({
      by: ["cowNumber"],
      where,
    });

    return NextResponse.json({
      status: total === 0 ? "no_data" : "ok",
      records,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalYield: Math.round((aggregates._sum.yield || 0) * 10) / 10,
        avgYield: Math.round((aggregates._avg.yield || 0) * 100) / 100,
        avgConductivity: Math.round((aggregates._avg.conductivity || 0) * 10) / 10,
        avgSCC: Math.round((aggregates._avg.scc || 0)),
        recordCount: aggregates._count,
        cowCount: uniqueCows.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
