import { NextResponse } from "next/server";
import { ReportGeneratorService } from "@/lib/services/reporting/report-generator.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await ReportGeneratorService.generateReport(id);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
