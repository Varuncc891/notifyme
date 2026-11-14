import { Router } from "express";
import { NotificationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { notificationQueue } from "../queue/notificationQueue";

const router = Router();
router.get("/", async (_req, res) => {
  const [counts, grouped] = await Promise.all([
    notificationQueue.getJobCounts("waiting", "active", "delayed"),
    prisma.notification.groupBy({ by: ["status"], _count: true }),
  ]);
  const database = Object.fromEntries(Object.values(NotificationStatus).map((status) => [status, 0])) as Record<NotificationStatus, number>;
  for (const item of grouped) database[item.status] = item._count;
  res.json({ queue: { waiting: counts.waiting ?? 0, active: counts.active ?? 0, delayed: counts.delayed ?? 0 }, database });
});
export default router;
