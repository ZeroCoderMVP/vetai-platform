import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const severity = searchParams.get("severity");
  const cowId = searchParams.get("cowId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: any = {};

  if (from || to) {
    where.timestamp = {};
    if (from) where.timestamp.gte = new Date(from);
    if (to) where.timestamp.lte = new Date(to + "T23:59:59Z");
  }

  if (severity && severity !== "all") {
    where.severity = severity;
  }

  if (cowId) {
    where.cowId = cowId;
  }

  try {
    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { cow: true, group: true },
      }),
      prisma.event.count({ where }),
    ]);

    // Статистика по серьёзности
    const severityCounts = await prisma.event.groupBy({
      by: ["severity"],
      where: { ...where, severity: undefined },
      _count: true,
    });

    const stats: Record<string, number> = {};
    for (const s of severityCounts) {
      stats[s.severity] = s._count;
    }

    return NextResponse.json({
      status: total === 0 ? "no_data" : "ok",
      events,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      stats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
