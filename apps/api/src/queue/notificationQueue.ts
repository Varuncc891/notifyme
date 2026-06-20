import { Queue } from "bullmq";

export const notificationQueue = new Queue(
  "notificationQueue",
  {
    connection: {
      host: "localhost",
      port: 6379,
    },
  }
);