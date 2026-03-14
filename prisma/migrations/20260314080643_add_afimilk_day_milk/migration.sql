-- CreateTable
CREATE TABLE "AfimilkDayMilk" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "farmId" TEXT NOT NULL,
    "cowId" TEXT,
    "cowNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "avg10Session1" REAL NOT NULL,
    "actualSession1" REAL NOT NULL,
    "avg10Session2" REAL NOT NULL,
    "actualSession2" REAL NOT NULL,
    "avg10Session3" REAL NOT NULL,
    "actualSession3" REAL NOT NULL,
    "avg10Total" REAL NOT NULL,
    "actualTotal" REAL NOT NULL,
    "batchId" TEXT,
    "sourceFile" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AfimilkDayMilk_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AfimilkDayMilk_cowId_fkey" FOREIGN KEY ("cowId") REFERENCES "Cow" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AfimilkDayMilk_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "IntegrationBatch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AfimilkDayMilk_farmId_date_idx" ON "AfimilkDayMilk"("farmId", "date");

-- CreateIndex
CREATE INDEX "AfimilkDayMilk_cowId_date_idx" ON "AfimilkDayMilk"("cowId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "AfimilkDayMilk_farmId_cowNumber_date_key" ON "AfimilkDayMilk"("farmId", "cowNumber", "date");

-- CreateIndex
CREATE INDEX "Event_timestamp_idx" ON "Event"("timestamp");

-- CreateIndex
CREATE INDEX "Event_cowId_timestamp_idx" ON "Event"("cowId", "timestamp");

-- CreateIndex
CREATE INDEX "Event_severity_timestamp_idx" ON "Event"("severity", "timestamp");
