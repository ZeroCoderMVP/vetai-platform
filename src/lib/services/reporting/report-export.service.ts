import { prisma } from "@/lib/prisma";

export class ReportExportService {
  /**
   * Generates a file (XLSX/PDF) depending on format and returns a File URL
   */
  static async exportInstance(instanceId: string, format: string) {
    // 1. Fetch instance data
    const instance = await prisma.reportInstance.findUnique({
      where: { id: instanceId },
    });
    
    if (!instance) throw new Error("Instance not found");

    // 2. Create Job
    const job = await prisma.reportExportJob.create({
      data: {
        reportInstanceId: instanceId,
        format,
        status: "PROCESSING"
      }
    });

    // 3. Mock file generation
    // In production, an external service or library like exceljs / puppeteer would run.
    const fileUrl = `/downloads/reports/${instanceId}_${format.toLowerCase()}.${format.toLowerCase() === "xlsx" ? "xlsx" : "pdf"}`;

    // 4. Update job & instance
    await prisma.reportExportJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", fileUrl, completedAt: new Date() }
    });

    await prisma.reportInstance.update({
      where: { id: instanceId },
      data: { fileUrl }
    });

    return { fileUrl };
  }
}
