import { prisma } from "@/lib/prisma";

export class NotificationService {
  /**
   * Defines a new notification to be pushed to the user's Inbox
   */
  static async createNotification(data: {
    title: string;
    message?: string;
    type: "action_required" | "report_alert" | "system_alert" | "info";
    priority?: "critical" | "high" | "medium" | "low";
    sourceType?: string;
    sourceId?: string;
    link?: string;
    isActionable?: boolean;
  }) {
    return prisma.notification.create({
      data: {
        userId: "system", // MVP single-user fallback
        title: data.title,
        message: data.message,
        type: data.type,
        priority: data.priority || "medium",
        sourceType: data.sourceType,
        sourceId: data.sourceId,
        link: data.link,
        isActionable: data.isActionable || false,
        status: "unread",
      }
    });
  }

  /**
   * Helper to wrap Report generation failures
   */
  static async notifyReportError(reportName: string, instanceId: string, errorMsg: string) {
    return this.createNotification({
      title: `Ошибка генерации отчёта: ${reportName}`,
      message: `Не удалось сформировать отчёт. Детали: ${errorMsg}`,
      type: "report_alert",
      priority: "high",
      sourceType: "ReportInstance",
      sourceId: instanceId,
      link: `/reporting/instances/${instanceId}`,
      isActionable: true
    });
  }

  /**
   * Helper to wrap Integration / Parsing failures
   */
  static async notifyImportError(source: string, batchId: string, errorMsg: string) {
    return this.createNotification({
      title: `Сбой импорта данных (${source})`,
      message: `Файл не был обработан. Ошибка: ${errorMsg}`,
      type: "system_alert",
      priority: "critical",
      sourceType: "IntegrationBatch",
      sourceId: batchId,
      link: `/admin/integration/${batchId}`,
      isActionable: true
    });
  }
}
