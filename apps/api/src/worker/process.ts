import { Job, UnrecoverableError } from "bullmq";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { deliver } from "./deliver";
import { classify } from "./classify";

export async function processNotification(job: Job<{ notificationId: string }>): Promise<void> {
  const { notificationId } = job.data;
  const log = logger.child({ jobId: job.id, notificationId, attempt: job.attemptsMade + 1 });
  const row = await prisma.notification.findUnique({ where: { id: notificationId } });
  if (!row) { log.error("Notification row missing"); return; }
  if (row.status === "SUCCESS" || row.status === "FAILED") { log.info({ status: row.status }, "Terminal notification skipped"); return; }
  await prisma.notification.update({ where: { id: row.id }, data: { status: "PROCESSING" } });
  try {
    const response = await deliver(row);
    await prisma.notification.update({ where: { id: row.id }, data: { status: "SUCCESS", retries: job.attemptsMade + 1, lastError: null, httpStatus: response.status } });
    log.info({ httpStatus: response.status }, "Webhook delivered");
  } catch (error) {
    const result = classify(error);
    log.warn({ error, category: result.category, httpStatus: result.httpStatus }, "Webhook delivery failed");
    const madeNow = job.attemptsMade + 1;
    const isFinal = !result.retryable || madeNow >= (job.opts.attempts ?? 1);
    await prisma.notification.update({ where: { id: row.id }, data: { retries: madeNow, lastError: result.category, httpStatus: result.httpStatus ?? null, status: isFinal ? "FAILED" : "PROCESSING" } });
    if (result.retryable) throw new Error(result.category);
    throw new UnrecoverableError(result.category);
  }
}
