-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT,
    "code" TEXT,
    "logoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'TRIAL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" DATETIME,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "maxEntities" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subscriptions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tool_definitions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionAr" TEXT,
    "descriptionEn" TEXT,
    "category" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "icon" TEXT,
    "color" TEXT,
    "configSchema" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "company_analyses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "toolCode" TEXT NOT NULL,
    "data" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" REAL,
    "completedAt" DATETIME,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "company_analyses_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "strategy_versions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_analyses_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "tool_definitions" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_entities" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT,
    "companyId" TEXT,
    "sectorId" TEXT,
    "industryId" TEXT,
    "typeId" TEXT,
    "size" TEXT,
    "school" TEXT,
    "culture" TEXT,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "entities_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "entities_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "ref_sectors" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "entities_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "ref_industries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "entities_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ref_entity_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_entities" ("createdAt", "displayName", "id", "industryId", "isActive", "legalName", "logoUrl", "school", "sectorId", "size", "typeId", "updatedAt") SELECT "createdAt", "displayName", "id", "industryId", "isActive", "legalName", "logoUrl", "school", "sectorId", "size", "typeId", "updatedAt" FROM "entities";
DROP TABLE "entities";
ALTER TABLE "new_entities" RENAME TO "entities";
CREATE INDEX "entities_companyId_idx" ON "entities"("companyId");
CREATE INDEX "entities_sectorId_idx" ON "entities"("sectorId");
CREATE INDEX "entities_industryId_idx" ON "entities"("industryId");
CREATE INDEX "entities_typeId_idx" ON "entities"("typeId");
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemRole" TEXT NOT NULL DEFAULT 'USER',
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_users" ("avatarUrl", "createdAt", "email", "id", "name", "password", "updatedAt") SELECT "avatarUrl", "createdAt", "email", "id", "name", "password", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "companies_code_key" ON "companies"("code");

-- CreateIndex
CREATE UNIQUE INDEX "subscriptions_companyId_key" ON "subscriptions"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "tool_definitions_code_key" ON "tool_definitions"("code");

-- CreateIndex
CREATE INDEX "tool_definitions_category_idx" ON "tool_definitions"("category");

-- CreateIndex
CREATE INDEX "tool_definitions_isPrimary_idx" ON "tool_definitions"("isPrimary");

-- CreateIndex
CREATE INDEX "company_analyses_versionId_idx" ON "company_analyses"("versionId");

-- CreateIndex
CREATE INDEX "company_analyses_toolId_idx" ON "company_analyses"("toolId");

-- CreateIndex
CREATE INDEX "company_analyses_toolCode_idx" ON "company_analyses"("toolCode");

-- CreateIndex
CREATE INDEX "company_analyses_status_idx" ON "company_analyses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "company_analyses_versionId_toolCode_key" ON "company_analyses"("versionId", "toolCode");
