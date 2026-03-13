import { NextResponse } from "next/server";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId") || undefined;
    const period = parseInt(searchParams.get("period") || "7", 10);
    
    // Defaulting to AО «Гатчинское» farmId just for MVP demonstration if not provided
    // const defaultFarmId = process.env.DEFAULT_FARM_ID;

    const summary = await DashboardService.getExecutiveSummary(farmId, period);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
