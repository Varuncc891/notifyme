import { Queue } from "bullmq";
import { createRedisConnection } from "./redis";

export const notificationQueue = new Queue(
  "notificationQueue",
  {
    connection: createRedisConnection(),
    defaultJobOptions: {
      removeOnComplete: { age: 3600, count: 1000 },
      removeOnFail: { age: 86400, count: 5000 },
    },
  }
);

export function enqueueNotification(id: string) {
  return notificationQueue.add("deliver", { notificationId: id }, {
    jobId: id,
    attempts: 4,
    backoff: { type: "custom" },
  });
}
