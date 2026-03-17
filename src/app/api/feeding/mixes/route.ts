import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const where: Record<string, any> = {};

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59Z");
  }

  try {
    const [records, total] = await Promise.all([
      (prisma as any).mixBatch.findMany({
        where,
        orderBy: { date: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { consumptions: { include: { ingredient: true } } },
      }),
      (prisma as any).mixBatch.count({ where }),
    ]);

    // Mixer stats
    let mixerStats: any[] = [];
    try {
      mixerStats = await (prisma as any).mixBatch.groupBy({
        by: ["mixer"],
        where,
        _count: true,
      });
    } catch {}

    return NextResponse.json({
      records: records || [],
      pagination: { page, limit, total: total || 0, pages: Math.ceil((total || 0) / limit) },
      mixerStats: (mixerStats || []).map((m: any) => ({
        mixer: m.mixer || "Неизвестно",
        count: m._count,
      })),
    });
  } catch (error: any) {
    // If table doesn't exist yet, return empty
    return NextResponse.json({
      records: [],
      pagination: { page, limit, total: 0, pages: 0 },
      mixerStats: [],
    });
  }
}
