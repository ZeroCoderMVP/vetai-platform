import { NextResponse } from "next/server";
import { ReportInstanceService } from "@/lib/services/reporting/report-instance.service";

export async function GET() {
  try {
    const instances = await ReportInstanceService.getAllInstances();
    return NextResponse.json(instances);
  } catch (error) {
    console.error("Failed to fetch instances:", error);
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { templateId, farmId, periodStart, periodEnd, title, format } = body;
    
    if (!templateId || !farmId || !periodStart || !periodEnd || !title || !format) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const instance = await ReportInstanceService.createDraft(
      templateId, 
      farmId,
      new Date(periodStart), 
      new Date(periodEnd), 
      title,
      format
    );
    
    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error("Failed to create report instance:", error);
    return NextResponse.json({ error: "Failed to create report instance" }, { status: 500 });
  }
}
