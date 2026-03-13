import { NextResponse } from "next/server";
import { OperationsService } from "@/lib/services/operations.service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const userId = "user_1"; 

    const confirmation = await OperationsService.confirmOperation(id, body, userId);
    return NextResponse.json(confirmation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
