-- CreateTable
CREATE TABLE "scenarios" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "description" TEXT,
    "probability" REAL DEFAULT 50,
    "impact" TEXT DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "totalBudgetChange" REAL DEFAULT 0,
    "totalRevenueChange" REAL DEFAULT 0,
    "overallImpactScore" REAL DEFAULT 0,
    "h1BudgetPct" REAL DEFAULT 70,
    "h2BudgetPct" REAL DEFAULT 20,
    "h3BudgetPct" REAL DEFAULT 10,
    "notes" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scenarios_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "scenario_variables" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "scenarioId" TEXT NOT NULL,
    "variableType" TEXT NOT NULL,
    "referenceId" TEXT,
    "referenceName" TEXT,
    "baselineValue" REAL,
    "adjustedValue" REAL,
    "changePercent" REAL DEFAULT 0,
    "changeType" TEXT NOT NULL DEFAULT 'PERCENT',
    "impactArea" TEXT,
    "impactScore" REAL DEFAULT 0,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "scenario_variables_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "scenarios" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "scenarios_versionId_idx" ON "scenarios"("versionId");

-- CreateIndex
CREATE INDEX "scenarios_type_idx" ON "scenarios"("type");

-- CreateIndex
CREATE INDEX "scenarios_status_idx" ON "scenarios"("status");

-- CreateIndex
CREATE INDEX "scenario_variables_scenarioId_idx" ON "scenario_variables"("scenarioId");

-- CreateIndex
CREATE INDEX "scenario_variables_variableType_idx" ON "scenario_variables"("variableType");
