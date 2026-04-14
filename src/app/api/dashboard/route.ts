import { NextRequest, NextResponse } from "next/server";
import { getSystemDate } from "@/lib/systemDate";
import { DashboardService } from "@/lib/services/dashboard.service";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const today = getSystemDate();
  const thirtyDaysAgo = getSystemDate();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const startDate = fromParam ? new Date(fromParam) : thirtyDaysAgo;
  const endDate = toParam ? new Date(toParam) : today;
  endDate.setHours(23, 59, 59, 999);
  startDate.setHours(0, 0, 0, 0);

  try {
    const data = await DashboardService.getMainDashboardData(startDate, endDate);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
