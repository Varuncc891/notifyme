import { Router } from "express";
import { NotificationStatus, Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { logger } from "../lib/logger";
import { enqueueNotification } from "../queue/notificationQueue";
import { validateCreateBody } from "./validation";

const router = Router();
const statuses = Object.values(NotificationStatus);

router.post("/", async (req, res) => {
  const validation = validateCreateBody(req.body);
  if (!validation.value) return res.status(400).json({ message: validation.message });
  try {
    const notification = await prisma.notification.create({ data: { ...validation.value, status: "PENDING" } });
    try { await enqueueNotification(notification.id); } catch (error) { logger.error({ error, notificationId: notification.id }, "Notification saved but enqueue failed; reconciler will retry"); }
    return res.status(201).json(notification);
  } catch (error) {
    logger.error({ error }, "Failed to create notification");
    return res.status(500).json({ message: "Failed to create notification" });
  }
});

router.get("/", async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const limit = Number(req.query.limit ?? 20);
  const status = req.query.status;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: "page must be positive and limit must be between 1 and 100" });
  if (status !== undefined && (typeof status !== "string" || !statuses.includes(status as NotificationStatus))) return res.status(400).json({ message: "status must be a valid notification status" });
  const where: Prisma.NotificationWhereInput = status ? { status: status as NotificationStatus } : {};
  try {
    const [data, total] = await Promise.all([
      prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      prisma.notification.count({ where }),
    ]);
    return res.json({ data, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) { logger.error({ error }, "Failed to list notifications"); return res.status(500).json({ message: "Failed to fetch notifications" }); }
});

router.get("/:id", async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) return res.status(404).json({ message: "Notification not found" });
  return res.json(notification);
});

export default router;
