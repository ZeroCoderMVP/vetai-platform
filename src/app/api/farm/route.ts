import { NextRequest, NextResponse } from "next/server";
import { getSystemDate } from "@/lib/systemDate";
import { FarmService } from "@/lib/services/farm.service";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");

    const today = getSystemDate();
    const thirtyDaysAgo = getSystemDate();
    thirtyDaysAgo.setDate(today.getDate() - 30);
  
    const startDate = fromParam ? new Date(fromParam) : today;
    const endDate = toParam ? new Date(toParam) : today;
    
    const data = await FarmService.getFarmData(startDate, endDate);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
