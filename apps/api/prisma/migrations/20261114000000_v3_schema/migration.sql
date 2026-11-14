CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED');
ALTER TABLE "Notification" ALTER COLUMN "status" TYPE "NotificationStatus" USING "status"::"NotificationStatus";
ALTER TABLE "Notification" ALTER COLUMN "status" SET DEFAULT 'PENDING';
ALTER TABLE "Notification" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'webhook';
ALTER TABLE "Notification" ADD COLUMN "httpStatus" INTEGER;
ALTER TABLE "Notification" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Notification" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
CREATE INDEX "Notification_status_createdAt_idx" ON "Notification"("status", "createdAt");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
