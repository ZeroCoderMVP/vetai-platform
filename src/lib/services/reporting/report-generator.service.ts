import { prisma } from "@/lib/prisma";
import { ReportValidationService } from "./report-validation.service";
import { ReportAuditService } from "./report-audit.service";

/**
 * Core builder pattern service for generating the 5 base system reports.
 */
export class ReportGeneratorService {
  /**
   * Main entry point to generate a report based on its template type.
   */
  static async generateReport(instanceId: string, userId: string = "system") {
    // 1. Fetch the instance and its template
    const instance = await prisma.reportInstance.findUnique({
      where: { id: instanceId },
      include: { template: true },
    });

    if (!instance) throw new Error("Report instance not found");

    // 2. Determine which builder to use based on the ReportType or specific code
    const type = instance.template.reportType;
    const code = instance.template.code;
    
    let payload = {};
    let summary = {};
    let validationIssues: any[] = [];

    try {
      // Dispatch to specific builder logic
      if (code === "REG-PLEM" || type === "BREEDING") {
        const result = await this.buildBreedingRegistryReport(instance);
        payload = result.payload;
        summary = result.summary;
        validationIssues = result.validationIssues;
      } 
      else if (code === "REG-MILK" || type === "REGULATORY") {
        const result = await this.buildMilkProductivityReport(instance);
        payload = result.payload;
        summary = result.summary;
        validationIssues = result.validationIssues;
      }
      else if (code === "VET-EPI" || type === "VETERINARY") {
        const result = await this.buildHealthReport(instance);
        payload = result.payload;
        summary = result.summary;
        validationIssues = result.validationIssues;
      }
      else if (code === "PROD-FEED" || type === "PRODUCTION") {
        const result = await this.buildFeedGroupReport(instance);
        payload = result.payload;
        summary = result.summary;
        validationIssues = result.validationIssues;
      }
      else if (code === "MGMT-HERD" || type === "MANAGEMENT") {
        const result = await this.buildReproductionReport(instance);
        payload = result.payload;
        summary = result.summary;
        validationIssues = result.validationIssues;
      } else {
        throw new Error(`Unsupported template code: ${code}`);
      }

      // 3. Save Validation Issues
      const hasErrors = await ReportValidationService.saveValidationIssues(instanceId, validationIssues);

      // 4. Update the instance status
      const newStatus = hasErrors ? "VALIDATION_ERROR" : "GENERATED";
      
      const updatedInstance = await prisma.reportInstance.update({
        where: { id: instanceId },
        data: {
          payloadJson: JSON.stringify(payload),
          summaryJson: JSON.stringify(summary),
          status: newStatus,
          generatedAt: new Date()
        }
      });

      // 5. Audit log
      await ReportAuditService.addAuditEntry({
        reportInstanceId: instanceId,
        action: "generated",
        actorId: userId,
        comment: `Generated report. Status: ${newStatus}`,
      });

      return { success: true, status: newStatus, instance: updatedInstance };
      
    } catch (err: any) {
      console.error(`Generation raw error for ${instanceId}:`, err);
      // Log failure
      await prisma.reportInstance.update({
        where: { id: instanceId },
        data: { status: "VALIDATION_ERROR" }
      });
      await ReportAuditService.addAuditEntry({
        reportInstanceId: instanceId,
        action: "generation_failed",
        actorId: userId,
        comment: err.message || "Unknown error during generation",
      });
      throw err;
    }
  }

  // --- Specific Builders (Mocked DB aggregations for Phase 4) --- //

  private static async buildBreedingRegistryReport(instance: any) {
    // Simulate fetching Cows from DB and validating them
    const cows = await prisma.cow.findMany({
      where: { farmId: instance.farmId, status: "active" },
      take: 50 // Limit for mock
    });
    
    const issues: any[] = [];
    if (cows.length > 0 && !cows[0].birthDate) {
       issues.push({ severity: "WARNING", code: "NO_BIRTHDATE", message: `Cow ${cows[0].number} missing birthdate` });
    }

    return {
      payload: { rows: cows },
      summary: { totalHead: cows.length, active: cows.length },
      validationIssues: issues
    };
  }

  private static async buildMilkProductivityReport(instance: any) {
    return {
      payload: { 
        metrics: [
          { Code: "4110", Name: "Надоено молока - всего, ц", Value: 456.7 },
          { Code: "4111", Name: "В том числе от коров молочного стада, ц", Value: 450.0 }
        ]
      },
      summary: { totalYield: 456.7, periodDays: 30 },
      validationIssues: []
    };
  }

  private static async buildHealthReport(instance: any) {
    return {
      payload: { 
        diseaseCount: { "Мастит": 12, "Хромота": 3 },
        criticalEvents: 0
      },
      summary: { totalIncidents: 15 },
      validationIssues: []
    };
  }

  private static async buildFeedGroupReport(instance: any) {
    return {
      payload: { 
        groups: [
          { groupName: "Новотельные", iofc: 540, dmi: 22.4 },
          { groupName: "Высокоудойные", iofc: 620, dmi: 24.1 }
        ]
      },
      summary: { averageIofc: 580 },
      validationIssues: []
    };
  }

  private static async buildReproductionReport(instance: any) {
    return {
      payload: { 
        events: [
          { type: "Осеменение", count: 45 },
          { type: "Отел", count: 22 }
        ]
      },
      summary: { totalEvents: 67 },
      validationIssues: []
    };
  }
}
