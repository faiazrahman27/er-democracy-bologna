-- AlterTable
ALTER TABLE "Assessment"
ADD COLUMN     "yearsOfExperience" INTEGER,
ADD COLUMN     "studyLevel" VARCHAR(100);

-- AlterTable
ALTER TABLE "VoteDisplaySettings"
ADD COLUMN     "showYearsOfExperienceBreakdown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showStudyLevelBreakdown" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Assessment_yearsOfExperience_idx" ON "Assessment"("yearsOfExperience");

-- CreateIndex
CREATE INDEX "Assessment_studyLevel_idx" ON "Assessment"("studyLevel");
