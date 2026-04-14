-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'CONSULTATION_ADMIN', 'CONTENT_ADMIN', 'ANALYTICS_ADMIN', 'AUDITOR');

-- CreateEnum
CREATE TYPE "VoteType" AS ENUM ('GENERAL', 'SPECIALIZED', 'SELF_ASSESSMENT');

-- CreateEnum
CREATE TYPE "VoteStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'CLOSED', 'ARCHIVED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ResultVisibilityMode" AS ENUM ('HIDE_ALL', 'SHOW_RAW_ONLY', 'SHOW_WEIGHTED_ONLY', 'SHOW_BOTH');

-- CreateEnum
CREATE TYPE "CalculationType" AS ENUM ('GENERAL', 'SPECIALIZED', 'SELF_ASSESSMENT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "passwordHash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "failedLoginCount" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secretUserId" VARCHAR(64) NOT NULL,
    "ageRange" VARCHAR(50),
    "gender" VARCHAR(50),
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "country" VARCHAR(100),
    "stakeholderRole" VARCHAR(100),
    "backgroundCategory" VARCHAR(100),
    "experienceLevel" VARCHAR(100),
    "relationshipToArea" VARCHAR(100),
    "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(1000) NOT NULL,
    "methodologySummary" VARCHAR(2000),
    "voteType" "VoteType" NOT NULL,
    "topicCategory" VARCHAR(100) NOT NULL,
    "status" "VoteStatus" NOT NULL DEFAULT 'DRAFT',
    "coverImageUrl" VARCHAR(500),
    "coverImageAlt" VARCHAR(255),
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "lockedAt" TIMESTAMP(3),
    "createdByAdminId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteOption" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "optionText" VARCHAR(300) NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteDisplaySettings" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "resultVisibilityMode" "ResultVisibilityMode" NOT NULL DEFAULT 'HIDE_ALL',
    "showParticipationStats" BOOLEAN NOT NULL DEFAULT false,
    "showStakeholderBreakdown" BOOLEAN NOT NULL DEFAULT false,
    "showBackgroundBreakdown" BOOLEAN NOT NULL DEFAULT false,
    "showLocationBreakdown" BOOLEAN NOT NULL DEFAULT false,
    "showAfterVotingOnly" BOOLEAN NOT NULL DEFAULT false,
    "showOnlyAfterVoteCloses" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoteDisplaySettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSubmission" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "selectedOptionId" TEXT NOT NULL,
    "selfAssessmentScore" INTEGER,
    "weightUsed" DECIMAL(10,4) NOT NULL,
    "calculationType" "CalculationType" NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(180) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "summary" VARCHAR(1000) NOT NULL,
    "content" TEXT NOT NULL,
    "coverImageUrl" VARCHAR(500),
    "coverImageAlt" VARCHAR(255),
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "actionType" VARCHAR(100) NOT NULL,
    "targetType" VARCHAR(100) NOT NULL,
    "targetId" VARCHAR(100) NOT NULL,
    "beforeJson" JSONB,
    "afterJson" JSONB,
    "reason" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_emailVerified_idx" ON "User"("emailVerified");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_userId_key" ON "Assessment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_secretUserId_key" ON "Assessment"("secretUserId");

-- CreateIndex
CREATE INDEX "Assessment_secretUserId_idx" ON "Assessment"("secretUserId");

-- CreateIndex
CREATE INDEX "Assessment_assessmentCompleted_idx" ON "Assessment"("assessmentCompleted");

-- CreateIndex
CREATE INDEX "Assessment_stakeholderRole_idx" ON "Assessment"("stakeholderRole");

-- CreateIndex
CREATE INDEX "Assessment_backgroundCategory_idx" ON "Assessment"("backgroundCategory");

-- CreateIndex
CREATE INDEX "Assessment_experienceLevel_idx" ON "Assessment"("experienceLevel");

-- CreateIndex
CREATE INDEX "Assessment_country_idx" ON "Assessment"("country");

-- CreateIndex
CREATE INDEX "Assessment_region_idx" ON "Assessment"("region");

-- CreateIndex
CREATE INDEX "Assessment_city_idx" ON "Assessment"("city");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_slug_key" ON "Vote"("slug");

-- CreateIndex
CREATE INDEX "Vote_slug_idx" ON "Vote"("slug");

-- CreateIndex
CREATE INDEX "Vote_status_idx" ON "Vote"("status");

-- CreateIndex
CREATE INDEX "Vote_voteType_idx" ON "Vote"("voteType");

-- CreateIndex
CREATE INDEX "Vote_topicCategory_idx" ON "Vote"("topicCategory");

-- CreateIndex
CREATE INDEX "Vote_isPublished_idx" ON "Vote"("isPublished");

-- CreateIndex
CREATE INDEX "Vote_startAt_idx" ON "Vote"("startAt");

-- CreateIndex
CREATE INDEX "Vote_endAt_idx" ON "Vote"("endAt");

-- CreateIndex
CREATE INDEX "Vote_createdByAdminId_idx" ON "Vote"("createdByAdminId");

-- CreateIndex
CREATE INDEX "VoteOption_voteId_idx" ON "VoteOption"("voteId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteOption_voteId_displayOrder_key" ON "VoteOption"("voteId", "displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VoteDisplaySettings_voteId_key" ON "VoteDisplaySettings"("voteId");

-- CreateIndex
CREATE INDEX "VoteSubmission_voteId_idx" ON "VoteSubmission"("voteId");

-- CreateIndex
CREATE INDEX "VoteSubmission_userId_idx" ON "VoteSubmission"("userId");

-- CreateIndex
CREATE INDEX "VoteSubmission_selectedOptionId_idx" ON "VoteSubmission"("selectedOptionId");

-- CreateIndex
CREATE INDEX "VoteSubmission_submittedAt_idx" ON "VoteSubmission"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "VoteSubmission_voteId_userId_key" ON "VoteSubmission"("voteId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_slug_key" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_slug_idx" ON "Article"("slug");

-- CreateIndex
CREATE INDEX "Article_status_idx" ON "Article"("status");

-- CreateIndex
CREATE INDEX "Article_publishedAt_idx" ON "Article"("publishedAt");

-- CreateIndex
CREATE INDEX "Article_createdById_idx" ON "Article"("createdById");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminUserId_idx" ON "AdminAuditLog"("adminUserId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_actionType_idx" ON "AdminAuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetType_idx" ON "AdminAuditLog"("targetType");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetId_idx" ON "AdminAuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteOption" ADD CONSTRAINT "VoteOption_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteDisplaySettings" ADD CONSTRAINT "VoteDisplaySettings_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSubmission" ADD CONSTRAINT "VoteSubmission_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSubmission" ADD CONSTRAINT "VoteSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSubmission" ADD CONSTRAINT "VoteSubmission_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "VoteOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
