-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ownerPlayerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSimulatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "walletData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ProgressTrack" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "trackKey" TEXT NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "ProgressTrack_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "baseStatsData" TEXT NOT NULL,
    "growthProfileData" TEXT NOT NULL,
    "tagsData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "AgentInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "experience" INTEGER NOT NULL DEFAULT 0,
    "effectiveStatsData" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentTaskId" TEXT,
    CONSTRAINT "AgentInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AgentInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "AgentTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskArchetype" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "baseDurationMs" INTEGER NOT NULL,
    "minAgents" INTEGER NOT NULL,
    "maxAgents" INTEGER NOT NULL,
    "primaryStatKey" TEXT NOT NULL,
    "secondaryStatKeysData" TEXT NOT NULL,
    "entryCostData" TEXT NOT NULL,
    "baseRewardData" TEXT NOT NULL,
    "requiredTrackThresholdsData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "TaskOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "taskArchetypeId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "isTaken" BOOLEAN NOT NULL DEFAULT false,
    "assignedTaskInstanceId" TEXT,
    CONSTRAINT "TaskOffer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskOffer_taskArchetypeId_fkey" FOREIGN KEY ("taskArchetypeId") REFERENCES "TaskArchetype" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "taskArchetypeId" TEXT NOT NULL,
    "originOfferId" TEXT,
    "assignedAgentIdsData" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "expectedCompletionAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL,
    "outcomeCategory" TEXT,
    "outcomeDetailsData" TEXT,
    CONSTRAINT "TaskInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskInstance_taskArchetypeId_fkey" FOREIGN KEY ("taskArchetypeId") REFERENCES "TaskArchetype" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FacilityTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "typeKey" TEXT NOT NULL,
    "tierConfigsData" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "FacilityInstance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "facilityTemplateId" TEXT NOT NULL,
    "currentTier" INTEGER NOT NULL,
    "constructedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpgradeAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FacilityInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FacilityInstance_facilityTemplateId_fkey" FOREIGN KEY ("facilityTemplateId") REFERENCES "FacilityTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnlockRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trackKey" TEXT NOT NULL,
    "thresholdValue" REAL NOT NULL,
    "effectsData" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Organization_ownerPlayerId_idx" ON "Organization"("ownerPlayerId");

-- CreateIndex
CREATE INDEX "ProgressTrack_organizationId_idx" ON "ProgressTrack"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressTrack_organizationId_trackKey_key" ON "ProgressTrack"("organizationId", "trackKey");

-- CreateIndex
CREATE INDEX "AgentInstance_organizationId_idx" ON "AgentInstance"("organizationId");

-- CreateIndex
CREATE INDEX "AgentInstance_status_idx" ON "AgentInstance"("status");

-- CreateIndex
CREATE INDEX "TaskOffer_organizationId_idx" ON "TaskOffer"("organizationId");

-- CreateIndex
CREATE INDEX "TaskOffer_isTaken_expiresAt_idx" ON "TaskOffer"("isTaken", "expiresAt");

-- CreateIndex
CREATE INDEX "TaskInstance_organizationId_idx" ON "TaskInstance"("organizationId");

-- CreateIndex
CREATE INDEX "TaskInstance_status_expectedCompletionAt_idx" ON "TaskInstance"("status", "expectedCompletionAt");

-- CreateIndex
CREATE INDEX "FacilityInstance_organizationId_idx" ON "FacilityInstance"("organizationId");
