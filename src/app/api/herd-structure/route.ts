import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const cows = await prisma.cow.findMany({
      where: {
        status: { in: ["active", "dry"] }
      },
      select: {
        birthDate: true,
        status: true,
        lactation: true,
      }
    });

    const now = new Date();

    const categories = [
      { id: "0-2m", name: "0–2 мес." },
      { id: "2-6m", name: "2–6 мес." },
      { id: "6-12m", name: "6–12 мес." },
      { id: "12-18m", name: "12–18 мес." },
      { id: "18m+", name: "18+ мес." },
      { id: "L1", name: "Лакт. 1" },
      { id: "L2", name: "Лакт. 2" },
      { id: "L3", name: "Лакт. 3" },
      { id: "L4+", name: "Лакт. 4+" },
    ];

    const dataMap: Record<string, { "Тёлки": number, "Нетели": number, "Быки": number, "Дойные": number, "Сухостойные": number }> = {};
    for (const c of categories) {
      dataMap[c.id] = { "Тёлки": 0, "Нетели": 0, "Быки": 0, "Дойные": 0, "Сухостойные": 0 };
    }

    let stats = {
      total: 0,
      young: { count: 0, heifers: 0, pregnantHeifers: 0, bulls: 0 },
      milkingStock: { count: 0, active: 0, dry: 0 },
      lactationSum: 0,
    };

    for (const cow of cows) {
      stats.total++;
      
      let ageMonths = 0;
      if (cow.birthDate) {
        const diffDays = Math.floor((now.getTime() - cow.birthDate.getTime()) / (1000 * 60 * 60 * 24));
        ageMonths = diffDays / 30.44;
      } else {
        if (cow.lactation > 0) ageMonths = 24 + cow.lactation * 12;
        else ageMonths = 6; 
      }

      let categoryId = "";
      if (cow.lactation === 0) {
        if (ageMonths <= 2) categoryId = "0-2m";
        else if (ageMonths <= 6) categoryId = "2-6m";
        else if (ageMonths <= 12) categoryId = "6-12m";
        else if (ageMonths <= 18) categoryId = "12-18m";
        else categoryId = "18m+";
      } else {
        if (cow.lactation === 1) categoryId = "L1";
        else if (cow.lactation === 2) categoryId = "L2";
        else if (cow.lactation === 3) categoryId = "L3";
        else categoryId = "L4+";
      }

      let type: "Тёлки" | "Нетели" | "Быки" | "Дойные" | "Сухостойные" = "Тёлки";
      if (cow.lactation === 0) {
        if (ageMonths >= 14) {
          type = "Нетели";
          stats.young.pregnantHeifers++;
        } else {
          type = "Тёлки";
          stats.young.heifers++;
        }
        stats.young.count++;
      } else {
        if (cow.status === "dry") {
          type = "Сухостойные";
          stats.milkingStock.dry++;
        } else {
          type = "Дойные";
          stats.milkingStock.active++;
        }
        stats.milkingStock.count++;
        stats.lactationSum += cow.lactation;
      }

      if (dataMap[categoryId] && dataMap[categoryId][type] !== undefined) {
          dataMap[categoryId][type]++;
      }
    }

    // Prepare chart data and remove zeros if all are zero? No, recharts handles 0 fine.
    const chartData = categories.map(c => ({
      name: c.name,
      id: c.id,
      ...dataMap[c.id]
    }));

    return NextResponse.json({
      success: true,
      chartData,
      stats: {
        ...stats,
        averageLactation: stats.milkingStock.count > 0 ? (stats.lactationSum / stats.milkingStock.count).toFixed(1) : 0
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
