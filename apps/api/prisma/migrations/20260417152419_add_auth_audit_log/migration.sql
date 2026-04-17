-- CreateTable
CREATE TABLE "AuthAuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "attemptedEmail" VARCHAR(255),
    "eventType" VARCHAR(100) NOT NULL,
    "ipAddress" VARCHAR(100),
    "userAgent" VARCHAR(500),
    "metadataJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuthAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuthAuditLog_userId_idx" ON "AuthAuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuthAuditLog_attemptedEmail_idx" ON "AuthAuditLog"("attemptedEmail");

-- CreateIndex
CREATE INDEX "AuthAuditLog_eventType_idx" ON "AuthAuditLog"("eventType");

-- CreateIndex
CREATE INDEX "AuthAuditLog_createdAt_idx" ON "AuthAuditLog"("createdAt");

-- AddForeignKey
ALTER TABLE "AuthAuditLog" ADD CONSTRAINT "AuthAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
