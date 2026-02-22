-- CreateTable
CREATE TABLE "ref_sectors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ref_industries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ref_entity_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT,
    "sectorId" TEXT,
    "industryId" TEXT,
    "typeId" TEXT,
    "size" TEXT,
    "school" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "entities_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "ref_sectors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "entities_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "ref_industries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "entities_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ref_entity_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "members_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategy_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "name" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "pivotedFromId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategy_versions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "strategy_versions_pivotedFromId_fkey" FOREIGN KEY ("pivotedFromId") REFERENCES "strategy_versions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_directions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategic_directions_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "external_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "factor" TEXT NOT NULL,
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "probability" REAL,
    "trend" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "external_analyses_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_objectives" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "parentId" TEXT,
    "perspective" TEXT,
    "weight" REAL DEFAULT 1.0,
    "baselineValue" REAL,
    "targetValue" REAL,
    "deadline" DATETIME,
    "ownerId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategic_objectives_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "strategic_objectives_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "strategic_objectives" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpis" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpis_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "kpis_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "strategic_objectives" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpi_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiId" TEXT NOT NULL,
    "value" REAL NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "enteredBy" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpi_entries_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_initiatives" (
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
    CONSTRAINT "strategic_initiatives_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reviewDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "type" TEXT DEFAULT 'QUARTERLY_REVIEW',
    "decision" TEXT,
    "summary" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "overallScore" REAL,
    "conductedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategic_reviews_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "dimensions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "dimensions_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "criteria" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dimensionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "score" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "criteria_dimensionId_fkey" FOREIGN KEY ("dimensionId") REFERENCES "dimensions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_choices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "choiceType" TEXT,
    "marketAttractiveness" INTEGER,
    "competitiveAdvantage" INTEGER,
    "feasibility" INTEGER,
    "riskLevel" TEXT DEFAULT 'MEDIUM',
    "isSelected" BOOLEAN NOT NULL DEFAULT false,
    "requiredCapabilities" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategic_choices_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_risks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "choiceId" TEXT,
    "versionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "probability" TEXT NOT NULL DEFAULT 'MEDIUM',
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "mitigation" TEXT,
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "category" TEXT,
    "probabilityScore" INTEGER,
    "impactScore" INTEGER,
    "riskScore" INTEGER,
    "contingency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "strategic_risks_choiceId_fkey" FOREIGN KEY ("choiceId") REFERENCES "strategic_choices" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "strategic_risks_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "kpi_diagnoses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kpiId" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "rootCause" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "kpi_diagnoses_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "kpis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "correction_actions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "diagnosisId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "dueDate" DATETIME,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "correction_actions_diagnosisId_fkey" FOREIGN KEY ("diagnosisId") REFERENCES "kpi_diagnoses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "analysis_points" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assessmentId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "impact" TEXT NOT NULL DEFAULT 'MEDIUM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "analysis_points_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "assessments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "financial_decisions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL,
    "currency" TEXT NOT NULL DEFAULT 'SAR',
    "type" TEXT NOT NULL DEFAULT 'INVESTMENT',
    "status" TEXT NOT NULL DEFAULT 'PROPOSED',
    "impact" TEXT,
    "decisionDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "financial_decisions_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "integrations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "webhookUrl" TEXT,
    "apiKey" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "config" TEXT,
    "lastSyncAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "integrations_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "strategic_alerts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'WARNING',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "entityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "oldData" TEXT,
    "newData" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "audit_logs_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "entities" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ref_sectors_nameAr_key" ON "ref_sectors"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "ref_sectors_nameEn_key" ON "ref_sectors"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "ref_sectors_code_key" ON "ref_sectors"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ref_industries_nameAr_key" ON "ref_industries"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "ref_industries_nameEn_key" ON "ref_industries"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "ref_industries_code_key" ON "ref_industries"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ref_entity_types_nameAr_key" ON "ref_entity_types"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "ref_entity_types_nameEn_key" ON "ref_entity_types"("nameEn");

-- CreateIndex
CREATE UNIQUE INDEX "ref_entity_types_code_key" ON "ref_entity_types"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "entities_sectorId_idx" ON "entities"("sectorId");

-- CreateIndex
CREATE INDEX "entities_industryId_idx" ON "entities"("industryId");

-- CreateIndex
CREATE INDEX "entities_typeId_idx" ON "entities"("typeId");

-- CreateIndex
CREATE INDEX "members_userId_idx" ON "members"("userId");

-- CreateIndex
CREATE INDEX "members_entityId_idx" ON "members"("entityId");

-- CreateIndex
CREATE UNIQUE INDEX "members_userId_entityId_key" ON "members"("userId", "entityId");

-- CreateIndex
CREATE INDEX "strategy_versions_entityId_idx" ON "strategy_versions"("entityId");

-- CreateIndex
CREATE INDEX "strategy_versions_pivotedFromId_idx" ON "strategy_versions"("pivotedFromId");

-- CreateIndex
CREATE UNIQUE INDEX "strategy_versions_entityId_versionNumber_key" ON "strategy_versions"("entityId", "versionNumber");

-- CreateIndex
CREATE INDEX "strategic_directions_versionId_idx" ON "strategic_directions"("versionId");

-- CreateIndex
CREATE INDEX "strategic_directions_type_idx" ON "strategic_directions"("type");

-- CreateIndex
CREATE INDEX "external_analyses_versionId_idx" ON "external_analyses"("versionId");

-- CreateIndex
CREATE INDEX "external_analyses_type_idx" ON "external_analyses"("type");

-- CreateIndex
CREATE INDEX "strategic_objectives_versionId_idx" ON "strategic_objectives"("versionId");

-- CreateIndex
CREATE INDEX "strategic_objectives_parentId_idx" ON "strategic_objectives"("parentId");

-- CreateIndex
CREATE INDEX "kpis_versionId_idx" ON "kpis"("versionId");

-- CreateIndex
CREATE INDEX "kpis_objectiveId_idx" ON "kpis"("objectiveId");

-- CreateIndex
CREATE INDEX "kpi_entries_kpiId_idx" ON "kpi_entries"("kpiId");

-- CreateIndex
CREATE INDEX "kpi_entries_periodStart_idx" ON "kpi_entries"("periodStart");

-- CreateIndex
CREATE INDEX "strategic_initiatives_versionId_idx" ON "strategic_initiatives"("versionId");

-- CreateIndex
CREATE INDEX "strategic_reviews_versionId_idx" ON "strategic_reviews"("versionId");

-- CreateIndex
CREATE INDEX "assessments_entityId_idx" ON "assessments"("entityId");

-- CreateIndex
CREATE INDEX "dimensions_assessmentId_idx" ON "dimensions"("assessmentId");

-- CreateIndex
CREATE INDEX "criteria_dimensionId_idx" ON "criteria"("dimensionId");

-- CreateIndex
CREATE INDEX "strategic_choices_versionId_idx" ON "strategic_choices"("versionId");

-- CreateIndex
CREATE INDEX "strategic_risks_choiceId_idx" ON "strategic_risks"("choiceId");

-- CreateIndex
CREATE INDEX "strategic_risks_versionId_idx" ON "strategic_risks"("versionId");

-- CreateIndex
CREATE INDEX "kpi_diagnoses_kpiId_idx" ON "kpi_diagnoses"("kpiId");

-- CreateIndex
CREATE INDEX "correction_actions_diagnosisId_idx" ON "correction_actions"("diagnosisId");

-- CreateIndex
CREATE INDEX "analysis_points_assessmentId_idx" ON "analysis_points"("assessmentId");

-- CreateIndex
CREATE INDEX "analysis_points_type_idx" ON "analysis_points"("type");

-- CreateIndex
CREATE INDEX "financial_decisions_entityId_idx" ON "financial_decisions"("entityId");

-- CreateIndex
CREATE INDEX "integrations_entityId_idx" ON "integrations"("entityId");

-- CreateIndex
CREATE INDEX "strategic_alerts_entityId_idx" ON "strategic_alerts"("entityId");

-- CreateIndex
CREATE INDEX "strategic_alerts_type_idx" ON "strategic_alerts"("type");

-- CreateIndex
CREATE INDEX "strategic_alerts_isRead_idx" ON "strategic_alerts"("isRead");

-- CreateIndex
CREATE INDEX "audit_logs_entityId_idx" ON "audit_logs"("entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
