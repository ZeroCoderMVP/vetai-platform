-- CreateTable
CREATE TABLE "Farm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GroupUnit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "headCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GroupUnit_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Cow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "groupId" TEXT,
    "number" TEXT NOT NULL,
    "name" TEXT,
    "birthDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lactation" INTEGER NOT NULL DEFAULT 0,
    "dim" INTEGER NOT NULL DEFAULT 0,
    "lastCalving" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Cow_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Cow_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExternalIdentity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cowId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    CONSTRAINT "ExternalIdentity_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cowId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'import',
    CONSTRAINT "GroupMembership_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroupMembership_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DataSource" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "lastSync" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "config" TEXT
);

-- CreateTable
CREATE TABLE "IntegrationBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "filename" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MetricDefinition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "formula" TEXT,
    "source" TEXT
);

-- CreateTable
CREATE TABLE "MetricValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "metricId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "timestamp" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'import',
    "quality" TEXT NOT NULL DEFAULT 'ok',
    CONSTRAINT "MetricValue_metricId_fkey" FOREIGN KEY ("metricId") REFERENCES "MetricDefinition" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MilkRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cowId" TEXT,
    "cowNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "session" INTEGER NOT NULL DEFAULT 1,
    "yield" REAL NOT NULL,
    "conductivity" REAL,
    "scc" REAL,
    "duration" REAL,
    "completeness" REAL,
    "stall" TEXT,
    "source" TEXT NOT NULL DEFAULT 'aic',
    "batchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MilkRecord_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "MilkRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IntegrationBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FeedRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT,
    "groupName" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "recipe" TEXT,
    "planned" REAL,
    "actual" REAL,
    "remainder" REAL,
    "dryMatter" REAL,
    "source" TEXT NOT NULL DEFAULT 'dtm',
    "batchId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FeedRecord_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "FeedRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IntegrationBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EventType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info'
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeId" TEXT,
    "cowId" TEXT,
    "groupId" TEXT,
    "farmId" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "timestamp" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'system',
    "metadata" TEXT,
    CONSTRAINT "Event_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "EventType" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cowId" TEXT,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "confidence" REAL,
    "modelVersion" TEXT,
    "cameraId" TEXT,
    "videoRef" TEXT,
    "timestamp" DATETIME NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Observation_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EconomicFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "period" DATETIME NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    CONSTRAINT "EconomicFact_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneticIndexValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cowId" TEXT NOT NULL,
    "index" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "date" DATETIME NOT NULL,
    CONSTRAINT "GeneticIndexValue_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ExternalIdentity_externalId_source_idx" ON "ExternalIdentity"("externalId", "source");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalIdentity_cowId_source_key" ON "ExternalIdentity"("cowId", "source");

-- CreateIndex
CREATE INDEX "GroupMembership_cowId_startDate_idx" ON "GroupMembership"("cowId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "DataSource_name_key" ON "DataSource"("name");

-- CreateIndex
CREATE INDEX "IntegrationBatch_sourceId_createdAt_idx" ON "IntegrationBatch"("sourceId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MetricDefinition_code_key" ON "MetricDefinition"("code");

-- CreateIndex
CREATE INDEX "MetricValue_metricId_objectType_objectId_timestamp_idx" ON "MetricValue"("metricId", "objectType", "objectId", "timestamp");

-- CreateIndex
CREATE INDEX "MetricValue_timestamp_idx" ON "MetricValue"("timestamp");

-- CreateIndex
CREATE INDEX "MilkRecord_cowNumber_date_idx" ON "MilkRecord"("cowNumber", "date");

-- CreateIndex
CREATE INDEX "MilkRecord_date_session_idx" ON "MilkRecord"("date", "session");

-- CreateIndex
CREATE UNIQUE INDEX "MilkRecord_cowNumber_date_session_source_key" ON "MilkRecord"("cowNumber", "date", "session", "source");

-- CreateIndex
CREATE INDEX "FeedRecord_date_groupName_idx" ON "FeedRecord"("date", "groupName");

-- CreateIndex
CREATE UNIQUE INDEX "EventType_code_key" ON "EventType"("code");

-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "Event_cowId_timestamp_idx" ON "Event"("cowId", "timestamp");

-- CreateIndex
CREATE INDEX "Event_severity_timestamp_idx" ON "Event"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "Observation_cowId_type_timestamp_idx" ON "Observation"("cowId", "type", "timestamp");

-- CreateIndex
CREATE INDEX "EconomicFact_farmId_type_period_idx" ON "EconomicFact"("farmId", "type", "period");

-- CreateIndex
CREATE INDEX "GeneticIndexValue_cowId_index_idx" ON "GeneticIndexValue"("cowId", "index");
