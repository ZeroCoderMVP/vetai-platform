import { prisma } from "@/lib/prisma";
import { ReportAuditService } from "./report-audit.service";

export class ReportSubmissionService {
  /**
   * Submit an approved report to an external system or manual channel
   */
  static async submitReport(instanceId: string, channel: string, userId: string = "system") {
    const submission = await prisma.reportSubmission.create({
      data: {
        reportInstanceId: instanceId,
        channel,
        status: "SENT",
        sentAt: new Date()
      }
    });

    await prisma.reportInstance.update({
      where: { id: instanceId },
      data: { status: "SUBMITTED", submittedAt: new Date() }
    });

    await ReportAuditService.addAuditEntry({
      reportInstanceId: instanceId,
      action: "submitted",
      actorId: userId,
      comment: `Submitted via ${channel}`
    });

    return submission;
  }
}
