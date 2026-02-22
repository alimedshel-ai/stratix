-- AlterTable
ALTER TABLE "analysis_points" ADD COLUMN "code" TEXT;

-- AlterTable
ALTER TABLE "strategic_objectives" ADD COLUMN "framework" TEXT DEFAULT 'BSC';
ALTER TABLE "strategic_objectives" ADD COLUMN "progress" REAL DEFAULT 0;
ALTER TABLE "strategic_objectives" ADD COLUMN "quarter" TEXT;

-- CreateTable
CREATE TABLE "data_entry_permissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "memberId" TEXT NOT NULL,
    "canEnterKPI" BOOLEAN NOT NULL DEFAULT true,
    "canEnterFinancial" BOOLEAN NOT NULL DEFAULT false,
    "canEnterReviews" BOOLEAN NOT NULL DEFAULT false,
    "canEnterAnalysis" BOOLEAN NOT NULL DEFAULT false,
    "canUploadFiles" BOOLEAN NOT NULL DEFAULT false,
    "departmentScope" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "data_entry_permissions_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "causal_links" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL DEFAULT 'ENABLES',
    "strength" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT,
    "hypothesis" TEXT,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "causal_links_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "causal_links_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "strategic_objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "causal_links_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "strategic_objectives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tows_strategies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "quadrant" TEXT NOT NULL,
    "internalPointId" TEXT NOT NULL,
    "externalPointId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "initiativeId" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tows_strategies_internalPointId_fkey" FOREIGN KEY ("internalPointId") REFERENCES "analysis_points" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tows_strategies_externalPointId_fkey" FOREIGN KEY ("externalPointId") REFERENCES "analysis_points" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "path_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pathCode" TEXT NOT NULL DEFAULT 'PATH_1',
    "email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "painChoice" TEXT,
    "currentStep" INTEGER NOT NULL DEFAULT 1,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "lastStepAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "path_answers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "answeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "path_answers_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "path_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "path_results" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "diagnosisText" TEXT NOT NULL,
    "singleNumber" REAL NOT NULL,
    "numberLabel" TEXT NOT NULL,
    "feedbackChoice" TEXT,
    "actionStarted" BOOLEAN NOT NULL DEFAULT false,
    "actionData" TEXT,
    CONSTRAINT "path_results_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "path_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_IndustryToSector" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_IndustryToSector_A_fkey" FOREIGN KEY ("A") REFERENCES "ref_industries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_IndustryToSector_B_fkey" FOREIGN KEY ("B") REFERENCES "ref_sectors" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_correction_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diagnosisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "analysisPointId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "correction_actions_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "kpi_diagnoses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "correction_actions_analysisPointId_fkey" FOREIGN KEY ("analysisPointId") REFERENCES "analysis_points" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_correction_actions" ("assignee", "completedAt", "createdAt", "description", "diagnosisId", "dueDate", "id", "status", "title", "updatedAt") SELECT "assignee", "completedAt", "createdAt", "description", "diagnosisId", "dueDate", "id", "status", "title", "updatedAt" FROM "correction_actions";
DROP TABLE "correction_actions";
ALTER TABLE "new_correction_actions" RENAME TO "correction_actions";
CREATE INDEX "correction_actions_diagnosisId_idx" ON "correction_actions"("diagnosisId");
CREATE INDEX "correction_actions_analysisPointId_idx" ON "correction_actions"("analysisPointId");
CREATE TABLE "new_kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "objectiveId" TEXT,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "target" REAL NOT NULL,
    "actual" REAL,
    "unit" TEXT NOT NULL DEFAULT '%',
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "formula" TEXT,
    "dataSource" TEXT,
    "frequency" TEXT DEFAULT 'MONTHLY',
    "warningThreshold" REAL,
    "criticalThreshold" REAL,
    "kpiType" TEXT,
    "bscPerspective" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpis_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "kpis_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "strategic_objectives" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_kpis" ("actual", "createdAt", "criticalThreshold", "dataSource", "description", "formula", "frequency", "id", "name", "nameAr", "objectiveId", "status", "target", "unit", "updatedAt", "versionId", "warningThreshold") SELECT "actual", "createdAt", "criticalThreshold", "dataSource", "description", "formula", "frequency", "id", "name", "nameAr", "objectiveId", "status", "target", "unit", "updatedAt", "versionId", "warningThreshold" FROM "kpis";
DROP TABLE "kpis";
ALTER TABLE "new_kpis" RENAME TO "kpis";
CREATE INDEX "kpis_versionId_idx" ON "kpis"("versionId");
CREATE INDEX "kpis_objectiveId_idx" ON "kpis"("objectiveId");
CREATE TABLE "new_dimensions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dimensions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_dimensions" ("assessmentId", "createdAt", "description", "id", "name", "updatedAt") SELECT "assessmentId", "createdAt", "description", "id", "name", "updatedAt" FROM "dimensions";
DROP TABLE "dimensions";
ALTER TABLE "new_dimensions" RENAME TO "dimensions";
CREATE INDEX "dimensions_assessmentId_idx" ON "dimensions"("assessmentId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "data_entry_permissions_memberId_key" ON "data_entry_permissions"("memberId");

-- CreateIndex
CREATE INDEX "data_entry_permissions_memberId_idx" ON "data_entry_permissions"("memberId");

-- CreateIndex
CREATE INDEX "causal_links_versionId_idx" ON "causal_links"("versionId");

-- CreateIndex
CREATE INDEX "causal_links_sourceId_idx" ON "causal_links"("sourceId");

-- CreateIndex
CREATE INDEX "causal_links_targetId_idx" ON "causal_links"("targetId");

-- CreateIndex
CREATE UNIQUE INDEX "causal_links_versionId_sourceId_targetId_key" ON "causal_links"("versionId", "sourceId", "targetId");

-- CreateIndex
CREATE INDEX "tows_strategies_assessmentId_idx" ON "tows_strategies"("assessmentId");

-- CreateIndex
CREATE INDEX "tows_strategies_quadrant_idx" ON "tows_strategies"("quadrant");

-- CreateIndex
CREATE INDEX "tows_strategies_internalPointId_idx" ON "tows_strategies"("internalPointId");

-- CreateIndex
CREATE INDEX "tows_strategies_externalPointId_idx" ON "tows_strategies"("externalPointId");

-- CreateIndex
CREATE INDEX "path_sessions_email_idx" ON "path_sessions"("email");

-- CreateIndex
CREATE INDEX "path_sessions_pathCode_idx" ON "path_sessions"("pathCode");

-- CreateIndex
CREATE INDEX "path_sessions_status_idx" ON "path_sessions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "path_answers_sessionId_questionId_key" ON "path_answers"("sessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "path_results_sessionId_key" ON "path_results"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "_IndustryToSector_AB_unique" ON "_IndustryToSector"("A", "B");

-- CreateIndex
CREATE INDEX "_IndustryToSector_B_index" ON "_IndustryToSector"("B");
