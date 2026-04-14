import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const pendingCount = await prisma.integrationBatch.count({
      where: { status: "processing" },
    });
    
    const errorCount = await prisma.integrationBatch.count({
        where: { status: "error" },
    });

    return NextResponse.json({
      sources,
      stats: { pendingCount, errorCount },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (body.action === "TOGGLE_SOURCE") {
      await prisma.dataSource.update({
        where: { id: body.sourceId },
        data: { status: body.status }
      });
      return NextResponse.json({ success: true });
    }
    if (body.action === "UNDO_BATCH") {
      await prisma.integrationBatch.update({
        where: { id: body.batchId },
        data: { status: "undone" }
      });
      // В реальном мире здесь также удаляются все сгенерированные Event с этого батча
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
