import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { confirmationStatus: "UNCONFIRMED" },
      include: {
        cow: { select: { number: true, name: true, id: true } },
        group: { select: { name: true, id: true } }
      },
      orderBy: { timestamp: "desc" }
    });
    return NextResponse.json({ success: true, data: events });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, eventIds, updates } = await req.json();

    if (action === "APPROVE") {
      // Bulk approve
      await prisma.event.updateMany({
        where: { id: { in: eventIds } },
        data: { confirmationStatus: "CONFIRMED_HUMAN", confirmedAt: new Date() }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "REJECT") {
      // Reject / Delete (or mark as rejected)
      await prisma.event.deleteMany({
        where: { id: { in: eventIds } }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "EDIT_APPROVE") {
      // Inline edit & approve single event
      await prisma.event.update({
        where: { id: eventIds[0] },
        data: { 
           title: updates.title,
           description: updates.description,
           confirmationStatus: "CONFIRMED_HUMAN", 
           confirmedAt: new Date() 
        }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
