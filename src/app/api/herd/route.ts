import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

type HerdItem = {
  id: string;
  cow: string;
  regNumber: string | null;
  group: string;
  status: string;
  lactation: number;
  dim: number;
  alerts: string[];
};

function normalizeStatus(status: string): string {
  if (status === "active") return "Дойная";
  if (status === "dry") return "Сухостойная";
  if (status === "culled") return "Выбыла";
  if (status === "dead") return "Пала";
  return status;
}

function extractAlertLabel(title: string, description: string | null): string {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();

  if (haystack.includes("mastit")) return "Мастит";
  if (haystack.includes("ketos")) return "Кетоз";
  if (haystack.includes("abort")) return "Аборт";
  if (haystack.includes("digestion") || haystack.includes("пищевар")) return "Пищеварение";
  if (haystack.includes("breed") || haystack.includes("осемен")) return "Осеменение";
  if (haystack.includes("fresh") || haystack.includes("свеж")) return "Свежая";
  if (haystack.includes("calv") || haystack.includes("отел")) return "Отёл";
  if (haystack.includes("heat") || haystack.includes("охот")) return "Охота";

  return "Здоровье";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();

  try {
    const cows = await prisma.cow.findMany({
      where: q
        ? {
            OR: [
              { number: { contains: q } },
              { name: { contains: q } },
              { externalIds: { some: { externalId: { contains: q } } } },
              { group: { name: { contains: q } } },
            ],
          }
        : undefined,
      orderBy: { number: "asc" },
      select: {
        id: true,
        number: true,
        status: true,
        lactation: true,
        dim: true,
        group: { select: { name: true } },
        externalIds: {
          where: { source: "afimilk" },
          select: { externalId: true },
          take: 1,
        },
      },
    });

    if (cows.length === 0) {
      return NextResponse.json({
        status: "no_data",
        total: 0,
        items: [] as HerdItem[],
      });
    }

    const cowIds = cows.map((cow) => cow.id);
    const events = await prisma.event.findMany({
      where: { cowId: { in: cowIds } },
      select: { cowId: true, title: true, description: true },
      orderBy: { timestamp: "desc" },
      take: 1000,
    });

    const alertsByCowId = new Map<string, Set<string>>();
    for (const event of events) {
      if (!event.cowId) continue;
      const next = alertsByCowId.get(event.cowId) ?? new Set<string>();
      next.add(extractAlertLabel(event.title, event.description));
      alertsByCowId.set(event.cowId, next);
    }

    const items: HerdItem[] = cows.map((cow) => ({
      id: cow.id,
      cow: cow.number,
      regNumber: cow.externalIds[0]?.externalId ?? null,
      group: cow.group?.name ?? "—",
      status: normalizeStatus(cow.status),
      lactation: cow.lactation,
      dim: cow.dim,
      alerts: Array.from(alertsByCowId.get(cow.id) ?? []).slice(0, 4),
    }));

    return NextResponse.json({
      status: "ok",
      total: items.length,
      items,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
