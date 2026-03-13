import { prisma } from "@/lib/prisma";

export class ReportAuditService {
  /**
   * Add an audit trail entry for a report instance
   */
  static async addAuditEntry(data: {
    reportInstanceId: string;
    action: string;
    actorId?: string;
    actorName?: string;
    beforeJson?: any;
    afterJson?: any;
    comment?: string;
  }) {
    return prisma.reportAuditLog.create({
      data: {
        reportInstanceId: data.reportInstanceId,
        action: data.action,
        actorId: data.actorId,
        actorName: data.actorName,
        beforeJson: data.beforeJson ? JSON.stringify(data.beforeJson) : null,
        afterJson: data.afterJson ? JSON.stringify(data.afterJson) : null,
        comment: data.comment,
      }
    });
  }

  /**
   * Get the audit trail for a specific report instance
   */
  static async getAuditTrail(reportInstanceId: string) {
    return prisma.reportAuditLog.findMany({
      where: { reportInstanceId },
      orderBy: { createdAt: "desc" },
    });
  }
}
