import { Router } from "express";
import { notificationQueue } from "../queue/notificationQueue";

const router = Router();

router.get("/", async (_, res) => {
  const counts =
    await notificationQueue.getJobCounts();

  res.json(counts);
});

export default router;