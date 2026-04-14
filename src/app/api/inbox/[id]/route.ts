import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { action } = await request.json(); // "CONFIRM" | "REJECT" | "CONFLICT"
    
    let newStatus = "UNCONFIRMED";
    if (action === "CONFIRM") newStatus = "CONFIRMED_HUMAN";
    else if (action === "CONFLICT") newStatus = "CONFLICT";
    else if (action === "REJECT") newStatus = "REJECTED"; // Will usually delete or mark

    const updated = await prisma.event.update({
      where: { id },
      data: { 
        confirmationStatus: newStatus,
        confirmedAt: newStatus === "CONFIRMED_HUMAN" ? new Date() : null,
      },
    });

    return NextResponse.json({ success: true, event: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
