import { prisma } from "@/lib/prisma";

export class CronService {
  /**
   * Identifies operations past their dueDate and sets them to OVERDUE.
   * Returns the count of updated records.
   */
  static async processOverdueOperations() {
    console.log("[Cron] Checking for overdue operations...");
    const now = new Date();
    
    const result = await prisma.operationRequest.updateMany({
      where: {
        status: { notIn: ["VERIFIED", "CANCELLED", "REJECTED", "ENTERED_IN_AFIMILK", "OVERDUE"] },
        dueDate: { lt: now }
      },
      data: {
        status: "OVERDUE"
      }
    });
    
    console.log(`[Cron] Marked ${result.count} operations as OVERDUE.`);
    return result.count;
  }

  /**
   * Captures a snapshot of current dashboard metrics
   */
  static async captureDashboardSnapshot(farmId: string) {
    console.log(`[Cron] Capturing snapshot for farm ${farmId}...`);
    // Example logic using the dashboard service or raw queries
    const now = new Date();
    
    const [totalCows, milkingCows, dryCows, pendingOps, overdueOps] = await Promise.all([
      prisma.cow.count({ where: { farmId, status: 'active' } }),
      prisma.cow.count({ where: { farmId, status: 'active' } }), // Simplification
      prisma.cow.count({ where: { farmId, status: 'dry' } }),
      prisma.operationRequest.count({
        where: { farmId, status: { in: ["CREATED", "PENDING_AFIMILK_ENTRY", "IN_PROGRESS", "NEEDS_VERIFICATION"] } }
      }),
      prisma.operationRequest.count({
        where: { farmId, status: "OVERDUE" }
      })
    ]);

    const snapshot = await prisma.dashboardSnapshot.create({
      data: {
        farmId,
        snapshotDate: now,
        totalCows,
        milkingCows,
        dryCows,
        freshCows: 0,
        pendingOperations: pendingOps,
        overdueOperations: overdueOps,
      }
    });

    console.log(`[Cron] Saved snapshot ${snapshot.id}...`);
    return snapshot;
  }
}
