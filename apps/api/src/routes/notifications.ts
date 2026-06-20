import { Router } from "express";
import { prisma } from "../lib/prisma";
import { notificationQueue } from "../queue/notificationQueue";

const router = Router();

router.post("/", async (req, res) => {
  try {
    const { url, payload } = req.body;

    const notification = await prisma.notification.create({
      data: {
        url,
        payload,
        status: "PENDING",
      },
    });

    await notificationQueue.add(
      "deliver-webhook",
      {
        notificationId: notification.id,
      },
      {
        attempts: 4,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      }
    );

    console.log(
      `Job queued for notification ${notification.id}`
    );

    res.status(201).json(notification);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to create notification",
    });
  }
});

router.get("/", async (_, res) => {
  try {
    const notifications =
      await prisma.notification.findMany({
        orderBy: {
          createdAt: "desc",
        },
      });

    res.json(notifications);

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
});

export default router;