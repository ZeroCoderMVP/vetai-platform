import { NextResponse } from "next/server";
import { OperationsService } from "@/lib/services/operations.service";
import prisma from "@/lib/prisma";

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
    const userId = "user_1"; 
    
    if (body.cowNumber) {
      const cow = await prisma.cow.findFirst({ where: { number: body.cowNumber } });
      if (!cow) {
        return NextResponse.json({ error: "Корова с таким номером не найдена" }, { status: 404 });
      }
      body.cowId = cow.id;
      body.farmId = cow.farmId;
      delete body.cowNumber;
    }
    
    // Fallback farmId if nothing found
    if (!body.farmId) {
       const farm = await prisma.farm.findFirst();
       if (farm) body.farmId = farm.id;
    }

    if (!body.eventDate) body.eventDate = new Date();

    const operation = await OperationsService.createOperation(body, userId);
    return NextResponse.json(operation);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
