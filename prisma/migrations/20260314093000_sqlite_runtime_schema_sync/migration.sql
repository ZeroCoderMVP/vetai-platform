-- Sync SQLite runtime schema with current Prisma models without resetting data.

ALTER TABLE "FeedRecord" ADD COLUMN "headCount" INTEGER;
ALTER TABLE "FeedRecord" ADD COLUMN "milkYield" REAL;
ALTER TABLE "FeedRecord" ADD COLUMN "iofc" REAL;
ALTER TABLE "FeedRecord" ADD COLUMN "feedCostPerHead" REAL;
ALTER TABLE "FeedRecord" ADD COLUMN "groupType" TEXT;
ALTER TABLE "FeedRecord" ADD COLUMN "corrPercent" REAL;
ALTER TABLE "FeedRecord" ADD COLUMN "targetWeight" REAL;
ALTER TABLE "FeedRecord" ADD COLUMN "feedingCount" INTEGER;

CREATE TABLE "Barn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Barn_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "FeedRecipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targetDM" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "FeedIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'кг',
    "dmPercent" REAL,
    "costPerKg" REAL
);

CREATE TABLE "RecipeIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "ingredientId" TEXT NOT NULL,
    "targetWeight" REAL NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "RecipeIngredient_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "FeedRecipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "RecipeIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "FeedIngredient" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "MixBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dtmBatchId" INTEGER,
    "recipeId" TEXT,
    "recipeName" TEXT NOT NULL,
    "groupCode" TEXT,
    "headCount" INTEGER,
    "date" DATETIME NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "loadDuration" TEXT,
    "mixDuration" TEXT,
    "mixer" TEXT,
    "pauseDuration" TEXT,
    "totalDuration" TEXT,
    "source" TEXT NOT NULL DEFAULT 'dtm',
    "batchId" TEXT,
    CONSTRAINT "MixBatch_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "FeedRecipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MixBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IntegrationBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "IngredientConsumption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "mixBatchId" TEXT,
    "ingredientId" TEXT,
    "ingredientCode" TEXT,
    "ingredientName" TEXT NOT NULL,
    "targetWeight" REAL,
    "indicatorWeight" REAL,
    "actualWeight" REAL,
    "loadedDM" REAL,
    "errorPercent" REAL,
    "errorAbsPercent" REAL,
    "totalConsumption" REAL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "IngredientConsumption_mixBatchId_fkey" FOREIGN KEY ("mixBatchId") REFERENCES "MixBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "IngredientConsumption_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "FeedIngredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ReportTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportType" TEXT NOT NULL,
    "authority" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "defaultFormat" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "configJson" TEXT,
    "schemaJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "farmId" TEXT,
    CONSTRAINT "ReportTemplate_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ReportSection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "configJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportSection_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportLine" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sectionId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "valueType" TEXT NOT NULL,
    "formula" TEXT,
    "sourceEntity" TEXT,
    "sourceField" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "configJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportLine_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "ReportSection" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "reportDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "format" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "payloadJson" TEXT,
    "summaryJson" TEXT,
    "fileUrl" TEXT,
    "generatedAt" DATETIME,
    "approvedAt" DATETIME,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdById" TEXT,
    "approvedById" TEXT,
    CONSTRAINT "ReportInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ReportInstance_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "ReportValidationIssue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportInstanceId" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "fieldName" TEXT,
    "detailsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportValidationIssue_reportInstanceId_fkey" FOREIGN KEY ("reportInstanceId") REFERENCES "ReportInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportExportJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportInstanceId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileUrl" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    CONSTRAINT "ReportExportJob_reportInstanceId_fkey" FOREIGN KEY ("reportInstanceId") REFERENCES "ReportInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportInstanceId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOT_SENT',
    "externalSystem" TEXT,
    "externalId" TEXT,
    "sentAt" DATETIME,
    "responseJson" TEXT,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReportSubmission_reportInstanceId_fkey" FOREIGN KEY ("reportInstanceId") REFERENCES "ReportInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ReportAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportInstanceId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "beforeJson" TEXT,
    "afterJson" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReportAuditLog_reportInstanceId_fkey" FOREIGN KEY ("reportInstanceId") REFERENCES "ReportInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "OperationRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "barnId" TEXT,
    "cowId" TEXT NOT NULL,
    "afiCowExternalId" TEXT,
    "operationType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventDate" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "severity" TEXT,
    "isCriticalForReporting" BOOLEAN NOT NULL DEFAULT false,
    "isCriticalForReproduction" BOOLEAN NOT NULL DEFAULT false,
    "isCriticalForVeterinary" BOOLEAN NOT NULL DEFAULT false,
    "requiresVerification" BOOLEAN NOT NULL DEFAULT true,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "confirmedAt" DATETIME,
    "confirmedById" TEXT,
    "rejectedAt" DATETIME,
    "rejectedById" TEXT,
    "rejectionReason" TEXT,
    "externalReference" TEXT,
    "comment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "deletedAt" DATETIME,
    CONSTRAINT "OperationRequest_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OperationRequest_barnId_fkey" FOREIGN KEY ("barnId") REFERENCES "Barn" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "OperationRequest_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OperationConfirmation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationRequestId" TEXT NOT NULL,
    "confirmedById" TEXT NOT NULL,
    "confirmedAt" DATETIME NOT NULL,
    "confirmationMethod" TEXT NOT NULL,
    "afiEntryDate" DATETIME,
    "afiEntryNumber" TEXT,
    "note" TEXT,
    "attachmentUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationConfirmation_operationRequestId_fkey" FOREIGN KEY ("operationRequestId") REFERENCES "OperationRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OperationStatusHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationRequestId" TEXT NOT NULL,
    "oldStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedById" TEXT NOT NULL,
    "changeReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationStatusHistory_operationRequestId_fkey" FOREIGN KEY ("operationRequestId") REFERENCES "OperationRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OperationComment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationRequestId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationComment_operationRequestId_fkey" FOREIGN KEY ("operationRequestId") REFERENCES "OperationRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "OperationAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "operationRequestId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OperationAttachment_operationRequestId_fkey" FOREIGN KEY ("operationRequestId") REFERENCES "OperationRequest" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "CowEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "cowId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventDate" DATETIME NOT NULL,
    "source" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CowEvent_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "DashboardSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "snapshotDate" DATETIME NOT NULL,
    "totalCows" INTEGER NOT NULL,
    "milkingCows" INTEGER NOT NULL,
    "dryCows" INTEGER NOT NULL,
    "freshCows" INTEGER NOT NULL,
    "avgMilkPerCow" REAL,
    "totalMilkPerDay" REAL,
    "alertCount" INTEGER NOT NULL DEFAULT 0,
    "criticalAlertCount" INTEGER NOT NULL DEFAULT 0,
    "pendingOperations" INTEGER NOT NULL DEFAULT 0,
    "overdueOperations" INTEGER NOT NULL DEFAULT 0,
    "completedOperations" INTEGER NOT NULL DEFAULT 0,
    "treatmentCount7d" INTEGER NOT NULL DEFAULT 0,
    "inseminationCount7d" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DashboardSnapshot_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "FeedRecipe_code_key" ON "FeedRecipe"("code");
CREATE UNIQUE INDEX "FeedIngredient_code_key" ON "FeedIngredient"("code");
CREATE UNIQUE INDEX "RecipeIngredient_recipeId_ingredientId_key" ON "RecipeIngredient"("recipeId", "ingredientId");
CREATE INDEX "MixBatch_date_groupCode_idx" ON "MixBatch"("date", "groupCode");
CREATE INDEX "IngredientConsumption_date_ingredientName_idx" ON "IngredientConsumption"("date", "ingredientName");
CREATE UNIQUE INDEX "ReportTemplate_code_version_key" ON "ReportTemplate"("code", "version");
CREATE INDEX "ReportTemplate_reportType_authority_isActive_idx" ON "ReportTemplate"("reportType", "authority", "isActive");
CREATE INDEX "ReportSection_templateId_sortOrder_idx" ON "ReportSection"("templateId", "sortOrder");
CREATE INDEX "ReportLine_sectionId_sortOrder_idx" ON "ReportLine"("sectionId", "sortOrder");
CREATE INDEX "ReportInstance_farmId_status_idx" ON "ReportInstance"("farmId", "status");
CREATE INDEX "ReportInstance_templateId_periodStart_periodEnd_idx" ON "ReportInstance"("templateId", "periodStart", "periodEnd");
CREATE INDEX "ReportInstance_reportDate_idx" ON "ReportInstance"("reportDate");
CREATE INDEX "ReportValidationIssue_reportInstanceId_severity_idx" ON "ReportValidationIssue"("reportInstanceId", "severity");
CREATE INDEX "ReportExportJob_reportInstanceId_format_idx" ON "ReportExportJob"("reportInstanceId", "format");
CREATE INDEX "ReportSubmission_reportInstanceId_status_idx" ON "ReportSubmission"("reportInstanceId", "status");
CREATE INDEX "ReportAuditLog_reportInstanceId_createdAt_idx" ON "ReportAuditLog"("reportInstanceId", "createdAt");
CREATE INDEX "OperationRequest_farmId_status_idx" ON "OperationRequest"("farmId", "status");
CREATE INDEX "OperationRequest_assignedToId_status_idx" ON "OperationRequest"("assignedToId", "status");
CREATE INDEX "OperationRequest_cowId_status_idx" ON "OperationRequest"("cowId", "status");
CREATE INDEX "OperationRequest_eventDate_idx" ON "OperationRequest"("eventDate");
CREATE INDEX "OperationRequest_dueDate_idx" ON "OperationRequest"("dueDate");
CREATE INDEX "CowEvent_farmId_eventType_eventDate_idx" ON "CowEvent"("farmId", "eventType", "eventDate");
CREATE INDEX "CowEvent_cowId_eventDate_idx" ON "CowEvent"("cowId", "eventDate");
CREATE INDEX "DashboardSnapshot_farmId_snapshotDate_idx" ON "DashboardSnapshot"("farmId", "snapshotDate");
