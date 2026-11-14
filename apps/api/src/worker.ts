import { Worker } from "bullmq";
import { createRedisConnection } from "./queue/redis";
import { processNotification } from "./worker/process";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";
import { stopReconciler } from "./reconciler";
import { config } from "./config";

if (config.allowPrivateWebhookTargets && config.nodeEnv !== "production") logger.warn("ALLOW_PRIVATE_WEBHOOK_TARGETS is enabled: private webhook targets are allowed for development");

const redis = createRedisConnection();
const worker = new Worker("notificationQueue", processNotification, {
  connection: redis,
  settings: {
    backoffStrategy: (attemptsMade) => {
      const base = 2000 * 2 ** (attemptsMade - 1);
      return Math.round(base + Math.random() * base * 0.2);
    },
  },
});

worker.on("completed", (job) => logger.info({ jobId: job.id, notificationId: job.data.notificationId }, "Queue job completed"));
worker.on("failed", (job, error) => logger.error({ error, jobId: job?.id, notificationId: job?.data.notificationId, attemptsMade: job?.attemptsMade }, "Queue job failed"));
worker.on("error", (error) => logger.error({ error }, "Worker error"));

let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  const killTimer = setTimeout(() => process.exit(1), 10_000);
  logger.info({ signal }, "Worker shutdown started");
  stopReconciler();
  await worker.close();
  await (await import("./queue/notificationQueue")).notificationQueue.close();
  await prisma.$disconnect();
  if (redis.status !== "end") await redis.quit();
  clearTimeout(killTimer);
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
