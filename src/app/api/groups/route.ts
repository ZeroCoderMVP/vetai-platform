import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const groups = await prisma.groupUnit.findMany({
      include: {
        _count: {
          select: { cows: true, feedRecords: true },
        },
        cows: {
          select: { lactation: true, status: true }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const parsedGroups = groups.map(g => {
      // Determine category based on cows
      let category = "Прочие";
      if (g.cows.length > 0) {
        let dryCount = 0;
        let milkingCount = 0;
        let youngCount = 0;
        
        for (const cow of g.cows) {
          if (cow.lactation === 0) youngCount++;
          else if (cow.status === "dry" || cow.status === "Сухостой") dryCount++;
          else milkingCount++;
        }

        const max = Math.max(dryCount, milkingCount, youngCount);
        if (max === milkingCount) category = "Дойное стадо";
        else if (max === dryCount) category = "Сухостойные";
        else if (max === youngCount) category = "Молодняк / Нетели";
      } else {
        // Fallback to name/type heuristics if empty
        const n = (g.name || "").toLowerCase();
        if (n.includes("дой") || n.includes("новотель")) category = "Дойное стадо";
        else if (n.includes("сухост") || n.includes("транзит")) category = "Сухостойные";
        else if (n.includes("тел") || n.includes("молод")) category = "Молодняк / Нетели";
      }

      return {
        id: g.id,
        code: g.name,
        name: g.description || g.name,
        type: g.type,
        category,
        cowCount: Math.max(g.headCount || 0, g._count.cows),
        activityStatus: g.isActive ? 'Active' : 'Inactive',
        createdAt: g.createdAt,
      };
    });

    return NextResponse.json({ success: true, data: parsedGroups });
  } catch (error: any) {
    console.error("Failed to fetch groups:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
