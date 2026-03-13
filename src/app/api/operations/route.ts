import { NextResponse } from "next/server";
import { OperationsService } from "@/lib/services/operations.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const farmId = searchParams.get("farmId") || undefined;
    const status = searchParams.get("status") || undefined;
    const priority = searchParams.get("priority") || undefined;
    
    // Defaulting to AО «Гатчинское» farmId just for MVP demonstration if not provided
    // const defaultFarmId = process.env.DEFAULT_FARM_ID;

    const operations = await OperationsService.getOperations({
      farmId,
      status,
      priority,
    });
    
    return NextResponse.json(operations);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Default mock user ID for creation since we bypass auth
    const userId = "user_1"; 
    
    const operation = await OperationsService.createOperation(body, userId);
    return NextResponse.json(operation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
