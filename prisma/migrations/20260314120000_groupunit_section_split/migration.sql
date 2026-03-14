-- Stage 1: split logical groups (GroupUnit) from physical placement (Section)

PRAGMA foreign_keys=OFF;

-- Redefine Cow to add afiId master external ID and currentSectionId reference.
CREATE TABLE "new_Cow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "groupId" TEXT,
    "barnId" TEXT,
    "currentSectionId" TEXT,
    "afiId" TEXT NOT NULL,
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
    CONSTRAINT "Cow_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupUnit" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cow_barnId_fkey" FOREIGN KEY ("barnId") REFERENCES "Barn" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Cow_currentSectionId_fkey" FOREIGN KEY ("currentSectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Cow" (
  "id","farmId","groupId","barnId","number","name","birthDate","status","lactation","dim","lastCalving","createdAt","updatedAt","afiId"
)
SELECT
  "id","farmId","groupId",NULL,"number","name","birthDate","status","lactation","dim","lastCalving","createdAt","updatedAt","number"
FROM "Cow";

DROP TABLE "Cow";
ALTER TABLE "new_Cow" RENAME TO "Cow";

-- Redefine IntegrationBatch to extend ingestion metrics.
CREATE TABLE "new_IntegrationBatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceId" TEXT NOT NULL,
    "source" TEXT,
    "filename" TEXT,
    "fileHash" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME,
    "finishedAt" DATETIME,
    "recordsRead" INTEGER NOT NULL DEFAULT 0,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsSkipped" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "errors" TEXT,
    "processedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntegrationBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "DataSource" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "new_IntegrationBatch" (
  "id","sourceId","filename","status","recordCount","errors","processedAt","createdAt"
)
SELECT
  "id","sourceId","filename","status","recordCount","errors","processedAt","createdAt"
FROM "IntegrationBatch";

DROP TABLE "IntegrationBatch";
ALTER TABLE "new_IntegrationBatch" RENAME TO "IntegrationBatch";

-- Redefine Event to attach optional section context.
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeId" TEXT,
    "cowId" TEXT,
    "groupId" TEXT,
    "sectionId" TEXT,
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
    CONSTRAINT "Event_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Event_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_Event" (
  "id","typeId","cowId","groupId","farmId","severity","title","description","timestamp","source","metadata"
)
SELECT
  "id","typeId","cowId","groupId","farmId","severity","title","description","timestamp","source","metadata"
FROM "Event";

DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";

PRAGMA foreign_keys=ON;

-- Physical section entity.
CREATE TABLE IF NOT EXISTS "Section" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "barnId" TEXT,
    "name" TEXT NOT NULL,
    "externalCode" TEXT,
    "dtmCode" TEXT,
    "afiCode" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Section_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Section_barnId_fkey" FOREIGN KEY ("barnId") REFERENCES "Barn" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Cow placement history.
CREATE TABLE IF NOT EXISTS "CowSectionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cowId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'import',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CowSectionHistory_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CowSectionHistory_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Group placement history.
CREATE TABLE IF NOT EXISTS "GroupSectionHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "groupId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "source" TEXT NOT NULL DEFAULT 'import',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GroupSectionHistory_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "GroupUnit" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "GroupSectionHistory_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Indexes for fast navigation and period queries.
CREATE UNIQUE INDEX IF NOT EXISTS "Section_farmId_name_key" ON "Section"("farmId", "name");
CREATE INDEX IF NOT EXISTS "Section_farmId_isActive_idx" ON "Section"("farmId", "isActive");
CREATE INDEX IF NOT EXISTS "Cow_farmId_afiId_idx" ON "Cow"("farmId", "afiId");
CREATE INDEX IF NOT EXISTS "CowSectionHistory_cowId_startDate_idx" ON "CowSectionHistory"("cowId", "startDate");
CREATE INDEX IF NOT EXISTS "CowSectionHistory_sectionId_startDate_idx" ON "CowSectionHistory"("sectionId", "startDate");
CREATE INDEX IF NOT EXISTS "GroupSectionHistory_groupId_startDate_idx" ON "GroupSectionHistory"("groupId", "startDate");
CREATE INDEX IF NOT EXISTS "GroupSectionHistory_sectionId_startDate_idx" ON "GroupSectionHistory"("sectionId", "startDate");
CREATE INDEX IF NOT EXISTS "Event_timestamp_idx" ON "Event"("timestamp");
CREATE INDEX IF NOT EXISTS "Event_cowId_timestamp_idx" ON "Event"("cowId", "timestamp");
CREATE INDEX IF NOT EXISTS "Event_groupId_timestamp_idx" ON "Event"("groupId", "timestamp");
CREATE INDEX IF NOT EXISTS "Event_sectionId_timestamp_idx" ON "Event"("sectionId", "timestamp");
CREATE INDEX IF NOT EXISTS "Event_severity_timestamp_idx" ON "Event"("severity", "timestamp");
CREATE INDEX IF NOT EXISTS "IntegrationBatch_sourceId_createdAt_idx" ON "IntegrationBatch"("sourceId", "createdAt");
