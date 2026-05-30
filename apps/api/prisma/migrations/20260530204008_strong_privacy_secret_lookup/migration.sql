/*
  Warnings:

  - You are about to drop the column `userId` on the `Assessment` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `VoteSubmission` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ownerHash]` on the table `Assessment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[voteId,voterHash]` on the table `VoteSubmission` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ownerHash` to the `Assessment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `voterHash` to the `VoteSubmission` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_userId_fkey";

-- DropForeignKey
ALTER TABLE "VoteSubmission" DROP CONSTRAINT "VoteSubmission_userId_fkey";

-- DropIndex
DROP INDEX "Assessment_userId_key";

-- DropIndex
DROP INDEX "VoteSubmission_userId_idx";

-- DropIndex
DROP INDEX "VoteSubmission_voteId_userId_key";

-- AlterTable
ALTER TABLE "Assessment" DROP COLUMN "userId",
ADD COLUMN     "ownerHash" VARCHAR(128) NOT NULL;

-- AlterTable
ALTER TABLE "VoteSubmission" DROP COLUMN "userId",
ADD COLUMN     "voterHash" VARCHAR(128) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_ownerHash_key" ON "Assessment"("ownerHash");

-- CreateIndex
CREATE INDEX "VoteSubmission_voterHash_idx" ON "VoteSubmission"("voterHash");

-- CreateIndex
CREATE INDEX "VoteSubmission_assessmentSecretUserId_idx" ON "VoteSubmission"("assessmentSecretUserId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteSubmission_voteId_voterHash_key" ON "VoteSubmission"("voteId", "voterHash");
