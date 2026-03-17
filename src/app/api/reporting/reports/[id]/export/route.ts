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
    
    if (format.toUpperCase() === "CSV") {
      const filename = `report_${id}_${new Date().toISOString().split('T')[0]}.csv`;
      
      // Return file natively
      return new NextResponse(result.content, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      });
    }

    // Fallback for other formats (if they were generating URLs)
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
