import express from "express";
import cors from "cors";
import { config } from "./config";
import { logger } from "./lib/logger";
import { prisma } from "./lib/prisma";
import { notificationQueue } from "./queue/notificationQueue";
import notificationsRouter from "./routes/notifications";
import metricsRouter from "./routes/metrics";

const app = express();
if (config.allowPrivateWebhookTargets && config.nodeEnv !== "production") logger.warn({ setting: "ALLOW_PRIVATE_WEBHOOK_TARGETS" }, "Private webhook targets are allowed for development");
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/notifications", notificationsRouter);
app.use("/metrics", metricsRouter);
app.use((error: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error?.type === "entity.too.large") return res.status(413).json({ message: "Request body exceeds the 1mb limit" });
  if (error instanceof SyntaxError && "body" in error) return res.status(400).json({ message: "Malformed JSON" });
  logger.error({ error }, "Unhandled API error");
  return res.status(500).json({ message: "Internal server error" });
});

const server = app.listen(config.port, () => logger.info({ port: config.port }, "API listening"));
let shuttingDown = false;
async function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  const killTimer = setTimeout(() => process.exit(1), 10_000);
  logger.info({ signal }, "API shutdown started");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await notificationQueue.close();
  await prisma.$disconnect();
  clearTimeout(killTimer);
  process.exit(0);
}
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
