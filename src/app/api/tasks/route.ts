import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        cow: { select: { id: true, number: true } },
        event: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ success: true, data: tasks });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, taskId, payload } = await req.json();

    if (action === "CREATE") {
      const task = await prisma.task.create({
        data: {
          farmId: payload.farmId,
          title: payload.title,
          description: payload.description,
          status: "TODO",
          priority: payload.priority || "MEDIUM",
          dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
          assigneeId: payload.assigneeId,
          cowId: payload.cowId,
          eventId: payload.eventId
        }
      });
      return NextResponse.json({ success: true, data: task });
    }

    if (action === "UPDATE_STATUS") {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: payload.status }
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
