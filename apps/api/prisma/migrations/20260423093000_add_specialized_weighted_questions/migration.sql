-- AlterTable
ALTER TABLE "VoteSubmission"
ADD COLUMN     "specializedBaseWeightUsed" DECIMAL(10,4),
ADD COLUMN     "specializedQuestionModifierTotal" DECIMAL(10,4);

-- CreateTable
CREATE TABLE "VoteWeightedQuestion" (
    "id" TEXT NOT NULL,
    "voteId" TEXT NOT NULL,
    "prompt" VARCHAR(500) NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoteWeightedQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteWeightedQuestionOption" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionText" VARCHAR(300) NOT NULL,
    "modifier" DECIMAL(10,4) NOT NULL,
    "displayOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoteWeightedQuestionOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VoteSubmissionWeightedAnswer" (
    "id" TEXT NOT NULL,
    "voteSubmissionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "optionId" TEXT NOT NULL,
    "modifierUsed" DECIMAL(10,4) NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoteSubmissionWeightedAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoteWeightedQuestion_voteId_idx" ON "VoteWeightedQuestion"("voteId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteWeightedQuestion_voteId_displayOrder_key" ON "VoteWeightedQuestion"("voteId", "displayOrder");

-- CreateIndex
CREATE INDEX "VoteWeightedQuestionOption_questionId_idx" ON "VoteWeightedQuestionOption"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteWeightedQuestionOption_questionId_id_key" ON "VoteWeightedQuestionOption"("questionId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "VoteWeightedQuestionOption_questionId_displayOrder_key" ON "VoteWeightedQuestionOption"("questionId", "displayOrder");

-- CreateIndex
CREATE INDEX "VoteSubmissionWeightedAnswer_voteSubmissionId_idx" ON "VoteSubmissionWeightedAnswer"("voteSubmissionId");

-- CreateIndex
CREATE INDEX "VoteSubmissionWeightedAnswer_questionId_idx" ON "VoteSubmissionWeightedAnswer"("questionId");

-- CreateIndex
CREATE INDEX "VoteSubmissionWeightedAnswer_questionId_optionId_idx" ON "VoteSubmissionWeightedAnswer"("questionId", "optionId");

-- CreateIndex
CREATE INDEX "VoteSubmissionWeightedAnswer_optionId_idx" ON "VoteSubmissionWeightedAnswer"("optionId");

-- CreateIndex
CREATE UNIQUE INDEX "VoteSubmissionWeightedAnswer_voteSubmissionId_questionId_key" ON "VoteSubmissionWeightedAnswer"("voteSubmissionId", "questionId");

-- AddForeignKey
ALTER TABLE "VoteWeightedQuestion" ADD CONSTRAINT "VoteWeightedQuestion_voteId_fkey" FOREIGN KEY ("voteId") REFERENCES "Vote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteWeightedQuestionOption" ADD CONSTRAINT "VoteWeightedQuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "VoteWeightedQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSubmissionWeightedAnswer" ADD CONSTRAINT "VoteSubmissionWeightedAnswer_voteSubmissionId_fkey" FOREIGN KEY ("voteSubmissionId") REFERENCES "VoteSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSubmissionWeightedAnswer" ADD CONSTRAINT "VoteSubmissionWeightedAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "VoteWeightedQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VoteSubmissionWeightedAnswer" ADD CONSTRAINT "VoteSubmissionWeightedAnswer_questionId_optionId_fkey" FOREIGN KEY ("questionId", "optionId") REFERENCES "VoteWeightedQuestionOption"("questionId", "id") ON DELETE CASCADE ON UPDATE CASCADE;
