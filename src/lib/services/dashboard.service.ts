import { prisma } from "@/lib/prisma";

export class DashboardService {
  /**
   * Retrieves high-level KPIs for the executive dashboard.
   */
  static async getExecutiveSummary(farmId?: string, periodDays: number = 7) {
    const whereFarm: any = farmId ? { id: farmId } : {};
    const whereCow: any = farmId ? { farmId } : {};
    const whereEvent: any = farmId ? { farmId } : {};
    
    // Date bounds
    const now = new Date();
    const periodStart = new Date();
    periodStart.setDate(now.getDate() - periodDays);

    const [
      totalCows, 
      dryCows, 
      eventsPeriod,
      operationsPending,
      operationsOverdue,
      operationsConfirmed,
      milkRecords
    ] = await Promise.all([
      prisma.cow.count({ where: { ...whereCow, status: 'active' } }),
      prisma.cow.count({ where: { ...whereCow, status: 'dry' } }),
      
      prisma.cowEvent.findMany({ 
        where: { 
          ...whereEvent, 
          eventDate: { gte: periodStart } 
        } 
      }),

      prisma.operationRequest.count({
        where: {
          ...(farmId && { farmId }),
          status: { in: ["CREATED", "PENDING_AFIMILK_ENTRY", "IN_PROGRESS", "NEEDS_VERIFICATION"] }
        }
      }),

      prisma.operationRequest.count({
        where: {
          ...(farmId && { farmId }),
          status: { notIn: ["VERIFIED", "CANCELLED", "REJECTED"] },
          dueDate: { lt: now }
        }
      }),

      prisma.operationRequest.count({
        where: {
          ...(farmId && { farmId }),
          status: "VERIFIED"
        }
      }),

      // getting today's milk yield approx
      prisma.milkRecord.aggregate({
        where: {
          date: { gte: new Date(now.setHours(0,0,0,0)) }
        },
        _sum: { yield: true }
      })
    ]);

    const milkingCows = totalCows - dryCows; // simplification
    const totalMilkPerDay = milkRecords._sum.yield || 0;
    const avgMilkPerCow = milkingCows > 0 ? totalMilkPerDay / milkingCows : 0;

    // Filter events
    const treatments7d = eventsPeriod.filter(e => e.eventType === "TREATMENT").length;
    const inseminations7d = eventsPeriod.filter(e => e.eventType === "INSEMINATION").length;

    // Approximating alerts as events with high severity
    const criticalAlerts = eventsPeriod.filter(e => {
      try {
        const meta = JSON.parse(e.metadata || "{}");
        return meta.severity === "CRITICAL";
      } catch { return false; }
    }).length;

    const confirmationRate = (operationsPending + operationsConfirmed) > 0 
      ? (operationsConfirmed / (operationsPending + operationsConfirmed)) * 100 
      : 0;

    return {
      population: {
        totalCows,
        milkingCows,
        dryCows,
        freshCows: 0 // Mocked for MVP
      },
      production: {
        avgMilkPerCow: Number(avgMilkPerCow.toFixed(1)),
        totalMilkPerDay: Number(totalMilkPerDay.toFixed(0)),
      },
      operations: {
        pendingOperations: operationsPending,
        overdueOperations: operationsOverdue,
        confirmationRate: Number(confirmationRate.toFixed(1))
      },
      events: {
        treatmentCount: treatments7d,
        inseminationCount: inseminations7d,
        criticalAlertCount: criticalAlerts,
        alertCount: eventsPeriod.length // Simplification
      }
    };
  }
}
