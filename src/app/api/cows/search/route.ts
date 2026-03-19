import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");

    if (!q || q.length < 2) {
      return NextResponse.json([]);
    }

    const cows = await prisma.cow.findMany({
      where: { 
        number: { contains: q },
        status: "active"
      },
      take: 8,
      select: {
        id: true,
        number: true,
        group: {
          select: { name: true }
        }
      },
      orderBy: { number: "asc" }
    });

    return NextResponse.json(cows);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
