import { NextResponse } from "next/server";
import { AnalyticsService } from "@/lib/services/analytics.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId") || undefined;
    const period = parseInt(searchParams.get("period") || "30", 10);
    
    const trend = await AnalyticsService.getMilkTrend(farmId, period);
    return NextResponse.json(trend);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
