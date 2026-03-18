import { prisma } from "@/lib/prisma";

export class ReportInstanceService {
  /**
   * Get all report instances
   */
  static async getAllInstances() {
    return prisma.reportInstance.findMany({
      include: {
        template: {
          select: { name: true, reportType: true, authority: true }
        },
        farm: {
          select: { name: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
  }

  /**
   * Get a specific instance by ID
   */
  static async getInstanceById(id: string) {
    return prisma.reportInstance.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            sections: {
              include: { lines: true }
            }
          }
        },
        farm: true,
        validationIssues: true,
        exports: true,
        submissions: true,
        auditLogs: { orderBy: { createdAt: "desc" } }
      }
    });
  }

  /**
   * Create a blank draft instance from a template
   */
  static async createDraft(templateId: string, farmId: string, dateStart: Date, dateEnd: Date, title: string, format: string) {
    return prisma.reportInstance.create({
      data: {
        templateId,
        farmId,
        periodStart: dateStart,
        periodEnd: dateEnd,
        reportDate: new Date(),
        title,
        status: "DRAFT",
        format,
      }
    });
  }
}
