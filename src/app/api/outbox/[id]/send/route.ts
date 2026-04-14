import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const updated = await prisma.outboxMessage.update({
      where: { id },
      data: { 
        status: "SENT",
        attempts: { increment: 1 },
        lastAttemptAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
