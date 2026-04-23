-- AlterTable
ALTER TABLE "VoteSubmission"
ADD COLUMN     "assessmentSecretUserId" VARCHAR(64),
ADD COLUMN     "assessmentAgeRange" VARCHAR(50),
ADD COLUMN     "assessmentGender" VARCHAR(50),
ADD COLUMN     "assessmentCity" VARCHAR(100),
ADD COLUMN     "assessmentRegion" VARCHAR(100),
ADD COLUMN     "assessmentCountry" VARCHAR(100),
ADD COLUMN     "assessmentStakeholderRole" VARCHAR(100),
ADD COLUMN     "assessmentBackgroundCategory" VARCHAR(100),
ADD COLUMN     "assessmentExperienceLevel" VARCHAR(100),
ADD COLUMN     "assessmentYearsOfExperience" INTEGER,
ADD COLUMN     "assessmentStudyLevel" VARCHAR(100),
ADD COLUMN     "assessmentRelationshipToArea" VARCHAR(100),
ADD COLUMN     "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false;

-- Backfill submission-time assessment snapshots for existing rows.
UPDATE "VoteSubmission" AS submission
SET
  "assessmentSecretUserId" = assessment."secretUserId",
  "assessmentAgeRange" = assessment."ageRange",
  "assessmentGender" = assessment."gender",
  "assessmentCity" = assessment."city",
  "assessmentRegion" = assessment."region",
  "assessmentCountry" = assessment."country",
  "assessmentStakeholderRole" = assessment."stakeholderRole",
  "assessmentBackgroundCategory" = assessment."backgroundCategory",
  "assessmentExperienceLevel" = assessment."experienceLevel",
  "assessmentYearsOfExperience" = assessment."yearsOfExperience",
  "assessmentStudyLevel" = assessment."studyLevel",
  "assessmentRelationshipToArea" = assessment."relationshipToArea",
  "assessmentCompleted" = assessment."assessmentCompleted"
FROM "Assessment" AS assessment
WHERE assessment."userId" = submission."userId";

-- CreateIndex
CREATE UNIQUE INDEX "VoteOption_voteId_id_key" ON "VoteOption"("voteId", "id");

-- CreateIndex
CREATE INDEX "VoteSubmission_voteId_selectedOptionId_idx" ON "VoteSubmission"("voteId", "selectedOptionId");

-- DropForeignKey
ALTER TABLE "VoteSubmission" DROP CONSTRAINT "VoteSubmission_selectedOptionId_fkey";

-- AddForeignKey
ALTER TABLE "VoteSubmission" ADD CONSTRAINT "VoteSubmission_voteId_selectedOptionId_fkey" FOREIGN KEY ("voteId", "selectedOptionId") REFERENCES "VoteOption"("voteId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
