import { NotificationStatus } from "@prisma/client";
import { notificationQueue, enqueueNotification } from "./queue/notificationQueue";
import { prisma } from "./lib/prisma";
import { logger } from "./lib/logger";
import { ErrorCategory } from "./worker/classify";

const allowed = new Set<ErrorCategory>(["NETWORK_ERROR", "TIMEOUT", "HTTP_4XX", "HTTP_5XX", "DNS_FAILURE", "SSRF_BLOCKED", "UNKNOWN"]);
export function sanitized(value?: string | null): ErrorCategory { return allowed.has(value as ErrorCategory) ? value as ErrorCategory : "UNKNOWN"; }

let inFlight = false;
export async function reconcileOnce() {
  if (inFlight) return;
  inFlight = true;
  try {
    const now = Date.now();
    const rows = await prisma.notification.findMany({
      where: { OR: [
        { status: NotificationStatus.PENDING, createdAt: { lt: new Date(now - 120_000) } },
        { status: NotificationStatus.PROCESSING, updatedAt: { lt: new Date(now - 600_000) } },
      ] }, take: 100, orderBy: { createdAt: "asc" },
    });
    for (const row of rows) {
      try {
        const job = await notificationQueue.getJob(row.id);
        if (!job) { await enqueueNotification(row.id); continue; }
        const state = await job.getState();
        if (state === "failed") await prisma.notification.update({ where: { id: row.id }, data: { status: "FAILED", lastError: sanitized(job.failedReason) } });
        else if (state === "completed") await prisma.notification.update({ where: { id: row.id }, data: { status: "SUCCESS" } });
      } catch (error) { logger.error({ error, notificationId: row.id }, "Reconciliation failed for notification"); }
    }
  } catch (error) { logger.error({ error }, "Reconciler run failed"); }
  finally { inFlight = false; }
}

export const reconcilerInterval = setInterval(() => void reconcileOnce(), 60_000);
export function stopReconciler() { clearInterval(reconcilerInterval); }
