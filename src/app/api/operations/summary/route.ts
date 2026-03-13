import { NextResponse } from "next/server";
import { OperationsService } from "@/lib/services/operations.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId") || undefined;
    
    const summary = await OperationsService.getSummary(farmId);
    return NextResponse.json(summary);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
