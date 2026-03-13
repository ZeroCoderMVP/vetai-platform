import { NextResponse } from "next/server";
import { runImport } from "@/services/importService";
import prisma from "@/lib/prisma";

/** GET — статус интеграций и батчей */
export async function GET() {
  try {
    const sources = await prisma.dataSource.findMany({
      include: {
        batches: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    const totalRecords = await prisma.milkRecord.count();
    const totalCows = await prisma.cow.count();
    const totalEvents = await prisma.event.count();

    return NextResponse.json({
      sources,
      totals: { records: totalRecords, cows: totalCows, events: totalEvents },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/** POST — запустить импорт из INBOX */
export async function POST() {
  try {
    const result = await runImport();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
