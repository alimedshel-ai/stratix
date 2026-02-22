/*
  Warnings:

  - You are about to drop the `causal_links` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `data_entry_permissions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `financial_decisions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `integrations` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `path_answers` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `path_results` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `path_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tows_strategies` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "causal_links_versionId_sourceId_targetId_key";

-- DropIndex
DROP INDEX "causal_links_targetId_idx";

-- DropIndex
DROP INDEX "causal_links_sourceId_idx";

-- DropIndex
DROP INDEX "causal_links_versionId_idx";

-- DropIndex
DROP INDEX "data_entry_permissions_memberId_idx";

-- DropIndex
DROP INDEX "data_entry_permissions_memberId_key";

-- DropIndex
DROP INDEX "financial_decisions_entityId_idx";

-- DropIndex
DROP INDEX "integrations_entityId_idx";

-- DropIndex
DROP INDEX "path_answers_sessionId_questionId_key";

-- DropIndex
DROP INDEX "path_results_sessionId_key";

-- DropIndex
DROP INDEX "path_sessions_status_idx";

-- DropIndex
DROP INDEX "path_sessions_pathCode_idx";

-- DropIndex
DROP INDEX "path_sessions_email_idx";

-- DropIndex
DROP INDEX "tows_strategies_externalPointId_idx";

-- DropIndex
DROP INDEX "tows_strategies_internalPointId_idx";

-- DropIndex
DROP INDEX "tows_strategies_quadrant_idx";

-- DropIndex
DROP INDEX "tows_strategies_assessmentId_idx";

-- AlterTable
ALTER TABLE "entities" ADD COLUMN "metadata" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "causal_links";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "data_entry_permissions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "financial_decisions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "integrations";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "path_answers";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "path_results";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "path_sessions";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "tows_strategies";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "initiative_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "initiative_tasks_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "strategic_initiatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "initiative_kpis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiativeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "target" REAL NOT NULL,
    "current" REAL NOT NULL DEFAULT 0,
    "unit" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "initiative_kpis_initiativeId_fkey" FOREIGN KEY ("initiativeId") REFERENCES "strategic_initiatives" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stakeholders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EXTERNAL',
    "influence" INTEGER NOT NULL DEFAULT 3,
    "interest" INTEGER NOT NULL DEFAULT 3,
    "strategy" TEXT NOT NULL DEFAULT 'inform',
    "position" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "engagement" INTEGER NOT NULL DEFAULT 50,
    "needs" TEXT,
    "expectations" TEXT,
    "contactInfo" TEXT,
    "lastContactAt" DATETIME,
    "meetingsCount" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT,
    "createdBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "stakeholders_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "stakeholder_risks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "stakeholderId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "impactLevel" TEXT NOT NULL DEFAULT 'MEDIUM',
    "impactType" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stakeholder_risks_stakeholderId_fkey" FOREIGN KEY ("stakeholderId") REFERENCES "stakeholders" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stakeholder_risks_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "strategic_risks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "mentions" TEXT,
    "parentId" TEXT,
    "entityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "targetName" TEXT,
    "details" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userAvatar" TEXT,
    "entityId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "statistical_datasets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "source" TEXT,
    "sourceUrl" TEXT,
    "year" INTEGER,
    "fileName" TEXT,
    "fileType" TEXT,
    "entityId" TEXT,
    "uploadedBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "company_patterns" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "pain" TEXT NOT NULL,
    "ambition" TEXT NOT NULL,
    "budget" REAL NOT NULL DEFAULT 20000,
    "pattern" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "company_patterns_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "statistical_records" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "datasetId" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "indicatorAr" TEXT,
    "value" REAL,
    "textValue" TEXT,
    "unit" TEXT,
    "period" TEXT,
    "region" TEXT,
    "subCategory" TEXT,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "statistical_records_datasetId_fkey" FOREIGN KEY ("datasetId") REFERENCES "statistical_datasets" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_company_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "data" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "company_analyses_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "company_analyses_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool_definitions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_company_analyses" ("completedAt", "createdAt", "createdBy", "data", "id", "progress", "score", "status", "summary", "toolCode", "toolId", "updatedAt", "updatedBy", "versionId") SELECT "completedAt", "createdAt", "createdBy", "data", "id", "progress", "score", "status", "summary", "toolCode", "toolId", "updatedAt", "updatedBy", "versionId" FROM "company_analyses";
DROP TABLE "company_analyses";
ALTER TABLE "new_company_analyses" RENAME TO "company_analyses";
CREATE INDEX "company_analyses_versionId_idx" ON "company_analyses"("versionId");
CREATE INDEX "company_analyses_toolCode_idx" ON "company_analyses"("toolCode");
CREATE INDEX "company_analyses_status_idx" ON "company_analyses"("status");
CREATE UNIQUE INDEX "company_analyses_versionId_toolCode_key" ON "company_analyses"("versionId", "toolCode");
CREATE TABLE "new_strategic_initiatives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "progress" REAL DEFAULT 0,
    "budget" REAL,
    "kpiId" TEXT,
    "priority" TEXT DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "category" TEXT,
    "autoCreated" BOOLEAN NOT NULL DEFAULT false,
    "budgetSpent" REAL DEFAULT 0,
    CONSTRAINT "strategic_initiatives_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_strategic_initiatives" ("budget", "createdAt", "description", "endDate", "id", "kpiId", "owner", "priority", "progress", "startDate", "status", "title", "updatedAt", "versionId") SELECT "budget", "createdAt", "description", "endDate", "id", "kpiId", "owner", "priority", "progress", "startDate", "status", "title", "updatedAt", "versionId" FROM "strategic_initiatives";
DROP TABLE "strategic_initiatives";
ALTER TABLE "new_strategic_initiatives" RENAME TO "strategic_initiatives";
CREATE INDEX "strategic_initiatives_versionId_idx" ON "strategic_initiatives"("versionId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "initiative_tasks_initiativeId_idx" ON "initiative_tasks"("initiativeId");

-- CreateIndex
CREATE INDEX "initiative_kpis_initiativeId_idx" ON "initiative_kpis"("initiativeId");

-- CreateIndex
CREATE INDEX "stakeholders_entityId_idx" ON "stakeholders"("entityId");

-- CreateIndex
CREATE INDEX "stakeholders_type_idx" ON "stakeholders"("type");

-- CreateIndex
CREATE INDEX "stakeholders_strategy_idx" ON "stakeholders"("strategy");

-- CreateIndex
CREATE INDEX "stakeholder_risks_stakeholderId_idx" ON "stakeholder_risks"("stakeholderId");

-- CreateIndex
CREATE INDEX "stakeholder_risks_riskId_idx" ON "stakeholder_risks"("riskId");

-- CreateIndex
CREATE UNIQUE INDEX "stakeholder_risks_stakeholderId_riskId_key" ON "stakeholder_risks"("stakeholderId", "riskId");

-- CreateIndex
CREATE INDEX "comments_targetType_targetId_idx" ON "comments"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "comments_userId_idx" ON "comments"("userId");

-- CreateIndex
CREATE INDEX "comments_entityId_idx" ON "comments"("entityId");

-- CreateIndex
CREATE INDEX "comments_parentId_idx" ON "comments"("parentId");

-- CreateIndex
CREATE INDEX "activities_entityId_idx" ON "activities"("entityId");

-- CreateIndex
CREATE INDEX "activities_userId_idx" ON "activities"("userId");

-- CreateIndex
CREATE INDEX "activities_targetType_targetId_idx" ON "activities"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "activities_createdAt_idx" ON "activities"("createdAt");

-- CreateIndex
CREATE INDEX "statistical_datasets_entityId_idx" ON "statistical_datasets"("entityId");

-- CreateIndex
CREATE INDEX "statistical_datasets_category_idx" ON "statistical_datasets"("category");

-- CreateIndex
CREATE INDEX "statistical_datasets_year_idx" ON "statistical_datasets"("year");

-- CreateIndex
CREATE UNIQUE INDEX "company_patterns_companyId_key" ON "company_patterns"("companyId");

-- CreateIndex
CREATE INDEX "statistical_records_datasetId_idx" ON "statistical_records"("datasetId");

-- CreateIndex
CREATE INDEX "statistical_records_indicator_idx" ON "statistical_records"("indicator");
