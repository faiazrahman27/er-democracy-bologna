-- AlterTable
ALTER TABLE "VoteDisplaySettings" ADD COLUMN     "showAgeRangeBreakdown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showExperienceLevelBreakdown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showGenderBreakdown" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showRelationshipBreakdown" BOOLEAN NOT NULL DEFAULT false;
