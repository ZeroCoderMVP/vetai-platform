import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { confirmationStatus: "CONFLICT" },
      include: {
        cow: { select: { number: true, name: true, id: true } }
      },
      orderBy: { dedupeKey: "asc" }
    });

    // Group by dedupeKey to send pairs
    const pairs: Record<string, any[]> = {};
    events.forEach(e => {
      const key = e.dedupeKey || e.id;
      if(!pairs[key]) pairs[key] = [];
      pairs[key].push(e);
    });

    const conflicts = Object.values(pairs).filter(arr => arr.length > 1);

    return NextResponse.json({ success: true, data: conflicts });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, winnerId, loserId, resolutionNote, dedupeKey } = await req.json();

    if (action === "RESOLVE") {
      // 1. Mark winner as CONFIRMED_HUMAN and add resolution note
      await prisma.event.update({
        where: { id: winnerId },
        data: { 
          confirmationStatus: "CONFIRMED_HUMAN", 
          confirmedAt: new Date(),
          metadata: resolutionNote ? JSON.stringify({ resolutionNote }) : undefined
        }
      });
      
      // 2. Reject loser
      if (loserId) {
        await prisma.event.delete({
          where: { id: loserId }
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
