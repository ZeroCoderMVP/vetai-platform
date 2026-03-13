import { NextResponse } from "next/server";
import { ReportExportService } from "@/lib/services/reporting/report-export.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const body = await request.json();
    const { format } = body;
    
    if (!format) {
      return NextResponse.json({ error: "Missing format" }, { status: 400 });
    }

    const { id } = await context.params;
    const result = await ReportExportService.exportInstance(id, format);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
