import { NextResponse } from "next/server";
import { ReportInstanceService } from "@/lib/services/reporting/report-instance.service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json({ error: "Missing report instance ID" }, { status: 400 });
    }

    const instance = await ReportInstanceService.getInstanceById(id);
    
    if (!instance) {
      return NextResponse.json({ error: "Report instance not found" }, { status: 404 });
    }

    return NextResponse.json(instance);
  } catch (error: any) {
    console.error("Failed to fetch instance by ID:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch instance" }, { status: 500 });
  }
}
