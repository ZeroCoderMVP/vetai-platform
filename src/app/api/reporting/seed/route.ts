import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const INITIAL_TEMPLATES = [
  {
    code: "REG-PLEM",
    name: "Отчет о племенной продаже",
    description: "Форма для ФГИС Племенное дело (Реализация племенного молодняка)",
    reportType: "BREEDING",
    authority: "BREEDING_REGISTRY",
    version: "1.0",
    defaultFormat: "XML",
  },
  {
    code: "REG-MILK",
    name: "Отчет по продуктивности (24-СХ)",
    description: "Сведения о состоянии животноводства (Молоко)",
    reportType: "REGULATORY",
    authority: "ROSSTAT",
    version: "1.0",
    defaultFormat: "XLSX",
  },
  {
    code: "VET-EPI",
    name: "Эпизоотическая ситуация",
    description: "Отчет в районную СББЖ по инфекционным заболеваниям",
    reportType: "VETERINARY",
    authority: "VET_SERVICE",
    version: "1.0",
    defaultFormat: "PDF",
  },
  {
    code: "PROD-FEED",
    name: "Аналитика конверсии корма (IOFC)",
    description: "Управленческий отчет по эффективности кормления по группам",
    reportType: "PRODUCTION",
    authority: "INTERNAL",
    version: "1.0",
    defaultFormat: "XLSX",
  },
  {
    code: "MGMT-HERD",
    name: "Движение поголовья (СП-51)",
    description: "Ежемесячный отчет о движении скота на ферме",
    reportType: "MANAGEMENT",
    authority: "INTERNAL",
    version: "1.0",
    defaultFormat: "XLSX",
  }
];

export async function GET() {
  try {
    let createdCount = 0;
    
    for (const tpl of INITIAL_TEMPLATES) {
      const existing = await prisma.reportTemplate.findFirst({ where: { code: tpl.code } });
      if (!existing) {
        await prisma.reportTemplate.create({ data: tpl });
        createdCount++;
      }
    }

    return NextResponse.json({ success: true, seeded: createdCount, message: `Seeded ${createdCount} templates.` });
  } catch (error) {
    console.error("Failed to seed templates:", error);
    return NextResponse.json({ error: "Failed to seed templates", details: String(error) }, { status: 500 });
  }
}
