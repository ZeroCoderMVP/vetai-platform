import { NextResponse } from "next/server";
import { startOfDay, endOfDay, parseISO } from "date-fns";
import { GroupService } from "@/lib/services/group.service";

export const dynamic = 'force-dynamic';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  
  const fromStr = searchParams.get("from");
  const toStr = searchParams.get("to");
  
  if (!fromStr || !toStr) {
     return NextResponse.json({ success: false, error: "Missing from/to params" }, { status: 400 });
  }

  const fromDate = startOfDay(parseISO(fromStr));
  const toDate = endOfDay(parseISO(toStr));

  try {
     const data = await GroupService.getGroupStats(id, fromDate, toDate);
     
     if (!data) {
        return NextResponse.json({ success: false, error: "Группа не найдена" }, { status: 404 });
     }

     return NextResponse.json({
        success: true,
        data
     });
  } catch (error: any) {
    console.error(`Failed to fetch group stats ${id}:`, error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
