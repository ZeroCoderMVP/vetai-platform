import { prisma } from "@/lib/prisma";

export interface ValidationIssue {
  severity: "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  code: string;
  message: string;
  entityType?: string;
  entityId?: string;
  fieldName?: string;
  details?: any;
}

export class ReportValidationService {
  /**
   * Clear old issues and save new validation issues for a report instance.
   * If there are ERROR or CRITICAL issues, updates instance status to VALIDATION_ERROR.
   * Otherwise, if none, maybe READY_FOR_REVIEW. This state transition can be managed by the generator.
   */
  static async saveValidationIssues(reportInstanceId: string, issues: ValidationIssue[]) {
    // Transaction to clear old and insert new
    await prisma.$transaction(async (tx) => {
      // Clear old issues
      await tx.reportValidationIssue.deleteMany({
        where: { reportInstanceId }
      });

      // Insert new ones if any
      if (issues.length > 0) {
        await tx.reportValidationIssue.createMany({
          data: issues.map(issue => ({
            reportInstanceId,
            severity: issue.severity,
            code: issue.code,
            message: issue.message,
            entityType: issue.entityType,
            entityId: issue.entityId,
            fieldName: issue.fieldName,
            detailsJson: issue.details ? JSON.stringify(issue.details) : null,
          }))
        });
      }
    });

    const hasErrors = issues.some(i => i.severity === "ERROR" || i.severity === "CRITICAL");
    return hasErrors;
  }
}
