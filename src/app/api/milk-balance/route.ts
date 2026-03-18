import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "Missing from or to parameters" }, { status: 400 });
  }

  const fromDate = new Date(from);
  const toDate = new Date(to + "T23:59:59Z");

  try {
    // 1. Получаем валовый надой из AFI DAY_MILK
    // В DAY_MILK фактические сессии это 2, 4, 6 (в модели actualSession1, actualSession2, actualSession3)
    // Либо можно сразу брать actualTotal, который является суммой фактических доений за день.
    const afiRecords = await prisma.afimilkDayMilk.findMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const totalYield = afiRecords.reduce((sum, record) => sum + (record.actualTotal || 0), 0);

    // 2. Получаем потоки из EconomicFact
    const economicFacts = await prisma.economicFact.findMany({
      where: {
        period: {
          gte: fromDate,
          lte: toDate,
        },
        type: {
          in: ["milk_sold", "milk_calves", "milk_loss", "milk_revenue"],
        },
      },
    });

    let milkSold = 0;
    let milkCalves = 0;
    let milkLoss = 0;
    let milkRevenue = 0;

    economicFacts.forEach((fact) => {
      if (fact.type === "milk_sold") milkSold += fact.value;
      if (fact.type === "milk_calves") milkCalves += fact.value;
      if (fact.type === "milk_loss") milkLoss += fact.value;
      if (fact.type === "milk_revenue") milkRevenue += fact.value;
    });

    // 3. Формируем структуру ответа
    
    // Формируем датасет по дням для графика экономики
    const dailyDataMap = new Map<string, { revenue: number; sold: number }>();
    
    economicFacts.forEach((fact) => {
      const dateStr = fact.period.toISOString().split("T")[0];
      if (!dailyDataMap.has(dateStr)) {
        dailyDataMap.set(dateStr, { revenue: 0, sold: 0 });
      }
      
      const dayData = dailyDataMap.get(dateStr)!;
      if (fact.type === "milk_revenue") dayData.revenue += fact.value;
      if (fact.type === "milk_sold") dayData.sold += fact.value;
    });

    const dailyEconomics = Array.from(dailyDataMap.entries())
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        averagePrice: data.sold > 0 ? Math.round((data.revenue / data.sold) * 100) / 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Вычисляем неучтенное молоко (разница между валовым надоем и распределенным)
    const distributedMilk = milkSold + milkCalves + milkLoss;
    const unaccountedMilk = totalYield > 0 ? Math.max(0, totalYield - distributedMilk) : 0;

    return NextResponse.json({
      success: true,
      data: {
        totalYield: Math.round(totalYield * 10) / 10,
        distributedMilk: Math.round(distributedMilk * 10) / 10,
        unaccountedMilk: Math.round(unaccountedMilk * 10) / 10,
        flows: {
          milkSold: Math.round(milkSold * 10) / 10,
          milkCalves: Math.round(milkCalves * 10) / 10,
          milkLoss: Math.round(milkLoss * 10) / 10,
        },
        economics: {
          milkRevenue: Math.round(milkRevenue * 100) / 100,
          averagePrice: milkSold > 0 ? Math.round((milkRevenue / milkSold) * 100) / 100 : 0,
          daily: dailyEconomics
        },
      },
    });
  } catch (error: any) {
    console.error("Error fetching milk balance:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
