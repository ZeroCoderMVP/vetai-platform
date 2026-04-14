import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const messages = await prisma.outboxMessage.findMany({
      include: {
        dataSource: { select: { name: true } },
      },
      orderBy: [
        { status: "asc" }, // UNSENT / FAILED will appear early
        { createdAt: "desc" }
      ]
    });
    return NextResponse.json({ success: true, data: messages });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, messageId } = await req.json();

    if (action === "RETRY") {
      // Logic to trigger a retry. In reality, this would just set it back to PENDING.
      await prisma.outboxMessage.update({
        where: { id: messageId },
        data: { 
          status: "PENDING",
          errorMessage: null,
          nextRetryAt: new Date()
        }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "CANCEL") {
      await prisma.outboxMessage.update({
        where: { id: messageId },
        data: { status: "CANCELLED" }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "RETRY_ALL_FAILED") {
      await prisma.outboxMessage.updateMany({
        where: { status: "FAILED" },
        data: { 
          status: "PENDING",
          errorMessage: null,
          nextRetryAt: new Date()
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
