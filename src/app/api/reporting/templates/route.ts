import { NextResponse } from "next/server";
import { ReportTemplateService } from "@/lib/services/reporting/report-template.service";

export async function GET() {
  try {
    const templates = await ReportTemplateService.getAllTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Failed to fetch templates:", error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }
}
