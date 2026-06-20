import { Worker } from "bullmq";
import axios from "axios";
import { prisma } from "./lib/prisma";

const worker = new Worker(
  "notificationQueue",
  async (job) => {
    const { notificationId } = job.data;

    const notification =
      await prisma.notification.findUnique({
        where: {
          id: notificationId,
        },
      });

    if (!notification) {
      throw new Error("Notification not found");
    }

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: "PROCESSING",
      },
    });

    console.log(
      `Attempt ${job.attemptsStarted} for ${notification.id}`
    );

    await axios.post(
      notification.url,
      notification.payload
    );

    await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        status: "SUCCESS",
        lastError: null,
      },
    });

    console.log(
      `Webhook sent successfully for ${notification.id}`
    );
  },
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);

worker.on("completed", async (job) => {
  console.log(`Job ${job.id} completed`);
});

worker.on("failed", async (job, err) => {
  console.log(
    `Job ${job?.id} failed attempt ${job?.attemptsMade}`
  );

  console.error(err.message);

  if (!job) return;

  const isFinalFailure =
    job.attemptsMade >= (job.opts.attempts ?? 1);

  if (isFinalFailure) {
    await prisma.notification.update({
      where: {
        id: job.data.notificationId,
      },
      data: {
        status: "FAILED",
        retries: job.attemptsMade,
        lastError: err.message,
      },
    });

    console.log(
      `Notification ${job.data.notificationId} marked FAILED`
    );
  }
});