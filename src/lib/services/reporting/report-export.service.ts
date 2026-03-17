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

    let fileContent = "";

    try {
      if (!instance.payloadJson) {
        throw new Error("No payload data to export.");
      }
      
      const payload = JSON.parse(instance.payloadJson);

      // Support basic CSV for MGMT-HERD / Reproduction report structure
      if (format.toUpperCase() === "CSV") {
        if (payload.totalAnimals !== undefined) {
          // MGMT-HERD format
          fileContent += `ПОКАЗАТЕЛЬ,ЗНАЧЕНИЕ\n`;
          fileContent += `Всего животных,${payload.totalAnimals}\n\n`;

          fileContent += `РАСПРЕДЕЛЕНИЕ ПО ГРУППАМ,ГОЛОВ\n`;
          if (Array.isArray(payload.groupsDistribution)) {
            payload.groupsDistribution.forEach((g: any) => {
              fileContent += `"${g.groupName}",${g.headCount}\n`;
            });
          }

          fileContent += `\nСОБЫТИЯ ЗА ПЕРИОД,КОЛИЧЕСТВО\n`;
          if (Array.isArray(payload.periodEvents)) {
            payload.periodEvents.forEach((e: any) => {
              fileContent += `"${e.type}",${e.count}\n`;
            });
          }
        } else {
          // Fallback Generic CSV
          fileContent += "Данные отчета,\n";
          fileContent += JSON.stringify(payload) + "\n";
        }
      } else {
        throw new Error(`Format ${format} is not fully supported for actual generation yet.`);
      }

      // 4. Update job & instance
      await prisma.reportExportJob.update({
        where: { id: job.id },
        data: { status: "COMPLETED", completedAt: new Date() }
      });

      return { job, content: fileContent };

    } catch (err: any) {
      await prisma.reportExportJob.update({
         where: { id: job.id },
         data: { status: "FAILED", errorMessage: err.message, completedAt: new Date() }
      });
      throw err;
    }
  }
}
