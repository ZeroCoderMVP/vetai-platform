import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Ковши/группы содержат эти слова в названии
const GROUP_PATTERNS = ["ковш", "стол", "молодняк", "сухостой", "раздой", "предзапуск"];

function isGroupName(name: string): boolean {
  const lower = name.toLowerCase();
  return GROUP_PATTERNS.some(p => lower.includes(p));
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Record<string, any> = {};

  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to + "T23:59:59Z");
  }

  try {
    // Все записи потребления
    const records = await (prisma as any).ingredientConsumption.findMany({
      where,
      orderBy: { ingredientName: "asc" },
      take: 1000,
    });

    // Разделяем на ингредиенты и ковши/группы
    const ingredientMap: Record<string, {
      target: number; actual: number; dm: number;
      errorSum: number; errorAbsSum: number; count: number;
    }> = {};
    const groupMap: Record<string, {
      target: number; actual: number; dm: number;
      errorSum: number; errorAbsSum: number; count: number;
    }> = {};

    for (const r of records) {
      const name = r.ingredientName || "N/A";
      const map = isGroupName(name) ? groupMap : ingredientMap;

      if (!map[name]) {
        map[name] = { target: 0, actual: 0, dm: 0, errorSum: 0, errorAbsSum: 0, count: 0 };
      }
      map[name].target += r.targetWeight || 0;
      map[name].actual += r.actualWeight || 0;
      map[name].dm += r.loadedDM || 0;
      map[name].errorSum += r.errorPercent || 0;
      map[name].errorAbsSum += r.errorAbsPercent || 0;
      map[name].count++;
    }

    const formatGroup = (map: Record<string, any>) =>
      Object.entries(map)
        .map(([name, g]) => ({
          ingredientName: name,
          groupName: name,
          totalTarget: Math.round(g.target * 10) / 10,
          totalActual: Math.round(g.actual * 10) / 10,
          totalDM: Math.round(g.dm * 10) / 10,
          totalConsumption: 0,
          avgError: g.count > 0 ? Math.round((g.errorSum / g.count) * 100) / 100 : 0,
          avgErrorAbs: g.count > 0 ? Math.round((g.errorAbsSum / g.count) * 100) / 100 : 0,
          count: g.count,
        }))
        .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, undefined, { numeric: true }));

    return NextResponse.json({
      records: records || [],
      byIngredient: formatGroup(ingredientMap),
      byGroup: formatGroup(groupMap),
    });
  } catch (error: any) {
    return NextResponse.json({
      records: [],
      byIngredient: [],
      byGroup: [],
    });
  }
}
