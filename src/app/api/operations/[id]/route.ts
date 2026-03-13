import { NextResponse } from "next/server";
import { OperationsService } from "@/lib/services/operations.service";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const operation = await OperationsService.getOperationById(id);
    if (!operation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(operation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
