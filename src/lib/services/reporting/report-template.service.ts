import { prisma } from "@/lib/prisma";

export class ReportTemplateService {
  /**
   * Get all available report templates
   */
  static async getAllTemplates() {
    return prisma.reportTemplate.findMany({
      where: { isActive: true },
      orderBy: { reportType: "asc" }
    });
  }

  /**
   * Get a specific template by code with its sections and lines
   */
  static async getTemplateByCode(code: string) {
    return prisma.reportTemplate.findFirst({
      where: { code },
      include: {
        sections: {
          orderBy: { sortOrder: "asc" },
          include: {
            lines: {
              orderBy: { sortOrder: "asc" }
            }
          }
        }
      }
    });
  }
}
