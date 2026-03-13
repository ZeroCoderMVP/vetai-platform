import { prisma } from "@/lib/prisma";

export class OperationsService {
  /**
   * Get multiple operations with filtering
   */
  static async getOperations(params: {
    farmId?: string;
    barnId?: string;
    status?: string;
    operationType?: string;
    assignedToId?: string;
    priority?: string;
  }) {
    const where: any = {};
    if (params.farmId) where.farmId = params.farmId;
    if (params.barnId) where.barnId = params.barnId;
    if (params.status) where.status = params.status;
    if (params.operationType) where.operationType = params.operationType;
    if (params.assignedToId) where.assignedToId = params.assignedToId;
    if (params.priority) where.priority = params.priority;

    return await prisma.operationRequest.findMany({
      where,
      include: {
        cow: true,
        barn: true,
      },
      orderBy: { eventDate: "desc" },
    });
  }

  /**
   * Get specific operation by ID
   */
  static async getOperationById(id: string) {
    return await prisma.operationRequest.findUnique({
      where: { id },
      include: {
        cow: true,
        barn: true,
        comments: { orderBy: { createdAt: 'desc' } },
        statusHistory: { orderBy: { createdAt: 'desc' } },
        confirmations: { orderBy: { createdAt: 'desc' } },
        attachments: true
      },
    });
  }

  /**
   * Create an operation request
   */
  static async createOperation(data: any, userId: string) {
    return await prisma.operationRequest.create({
      data: {
        ...data,
        status: "CREATED",
        createdById: userId,
        statusHistory: {
          create: {
            newStatus: "CREATED",
            changedById: userId,
            changeReason: "Initial creation",
          }
        }
      },
      include: { cow: true }
    });
  }

  /**
   * Update operation status and record history
   */
  static async updateStatus(id: string, newStatus: string, userId: string, reason?: string) {
    const operation = await prisma.operationRequest.findUnique({ where: { id } });
    if (!operation) throw new Error("Operation not found");

    return await prisma.$transaction(async (tx: any) => {
      const updated = await tx.operationRequest.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.operationStatusHistory.create({
        data: {
          operationRequestId: id,
          oldStatus: operation.status,
          newStatus,
          changedById: userId,
          changeReason: reason || `Status changed to ${newStatus}`
        }
      });

      return updated;
    });
  }

  /**
   * Confirm that the operation was entered into AfiMilk
   */
  static async confirmOperation(id: string, data: any, userId: string) {
    return await prisma.$transaction(async (tx: any) => {
      const confirmation = await tx.operationConfirmation.create({
        data: {
          operationRequestId: id,
          confirmedById: userId,
          confirmedAt: data.confirmedAt ? new Date(data.confirmedAt) : new Date(),
          confirmationMethod: data.confirmationMethod || "MANUAL_CONFIRMATION",
          afiEntryDate: data.afiEntryDate ? new Date(data.afiEntryDate) : null,
          afiEntryNumber: data.afiEntryNumber || null,
          note: data.note || null,
        }
      });

      const updated = await tx.operationRequest.update({
        where: { id },
        data: {
          status: "ENTERED_IN_AFIMILK",
          confirmedAt: confirmation.confirmedAt,
          confirmedById: userId
        }
      });

      await tx.operationStatusHistory.create({
        data: {
          operationRequestId: id,
          oldStatus: "PENDING_AFIMILK_ENTRY",
          newStatus: "ENTERED_IN_AFIMILK",
          changedById: userId,
          changeReason: "Operation documented in AfiMilk and confirmed in VETAI."
        }
      });

      return confirmation;
    });
  }

  /**
   * Add a generic comment to the operation
   */
  static async addComment(id: string, text: string, userId: string) {
    return await prisma.operationComment.create({
      data: {
        operationRequestId: id,
        authorId: userId,
        text,
      }
    });
  }

  /**
   * Get operations summary logic for dashboards
   */
  static async getSummary(farmId?: string) {
    const where: any = {};
    if (farmId) where.farmId = farmId;

    const [pendingCount, overdueCount, verifiedCount, allConfirms] = await Promise.all([
      prisma.operationRequest.count({
        where: {
          ...where,
          status: { in: ["CREATED", "PENDING_AFIMILK_ENTRY", "IN_PROGRESS", "NEEDS_VERIFICATION"] }
        }
      }),
      prisma.operationRequest.count({
        where: {
          ...where,
          status: { notIn: ["VERIFIED", "CANCELLED", "REJECTED"] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.operationRequest.count({
        where: { ...where, status: "VERIFIED" }
      }),
      prisma.operationConfirmation.findMany({
        where: { operationRequest: where },
        select: { confirmedAt: true, operationRequest: { select: { createdAt: true } } }
      })
    ]);

    // Calculate average confirmation time
    let totalTime = 0;
    allConfirms.forEach((c: any) => {
      const diff = new Date(c.confirmedAt).getTime() - new Date(c.operationRequest.createdAt).getTime();
      totalTime += Math.max(0, diff);
    });

    const avgConfirmationTimeMs = allConfirms.length > 0 ? totalTime / allConfirms.length : 0;
    
    // Groupings by priority and type (simplified using groupby)
    const byPriority = await prisma.operationRequest.groupBy({
      by: ['priority'],
      where,
      _count: { id: true }
    });

    const byOperationType = await prisma.operationRequest.groupBy({
      by: ['operationType'],
      where,
      _count: { id: true }
    });

    return {
      pendingCount,
      overdueCount,
      verifiedCount,
      avgConfirmationTimeHours: avgConfirmationTimeMs / (1000 * 60 * 60),
      byPriority: byPriority.map(b => ({ priority: b.priority, count: b._count.id })),
      byOperationType: byOperationType.map(b => ({ type: b.operationType, count: b._count.id }))
    };
  }
}
