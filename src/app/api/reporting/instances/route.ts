import { NextResponse } from "next/server";
import { ReportInstanceService } from "@/lib/services/reporting/report-instance.service";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const instances = await ReportInstanceService.getAllInstances();
    return NextResponse.json(instances);
  } catch (error) {
    console.error("Failed to fetch instances:", error);
    return NextResponse.json({ error: "Failed to fetch instances" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { templateId, farmId, periodStart, periodEnd, title, format } = body;
    
    if (!templateId) {
      return NextResponse.json({ error: "Missing templateId" }, { status: 400 });
    }

    const template = await prisma.reportTemplate.findUnique({ where: { id: templateId } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    if (!farmId) {
      const firstFarm = await prisma.farm.findFirst();
      if (!firstFarm) return NextResponse.json({ error: "No farm found in DB" }, { status: 400 });
      farmId = firstFarm.id;
    }

    if (!periodStart || !periodEnd) {
      const today = new Date();
      periodStart = new Date(Date.UTC(today.getFullYear(), today.getMonth(), 1)).toISOString();
      periodEnd = new Date(Date.UTC(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)).toISOString();
    }

    if (!title) {
      title = `${template.name} (${new Date().toLocaleString('ru', { month: 'long', year: 'numeric' })})`;
    }

    if (!format) {
      format = template.defaultFormat || "CSV";
    }

    const instance = await ReportInstanceService.createDraft(
      templateId, 
      farmId,
      new Date(periodStart), 
      new Date(periodEnd), 
      title,
      format
    );
    
    return NextResponse.json(instance, { status: 201 });
  } catch (error) {
    console.error("Failed to create report instance:", error);
    return NextResponse.json({ error: "Failed to create report instance" }, { status: 500 });
  }
}
