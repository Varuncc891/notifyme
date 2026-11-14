import "dotenv/config";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL || undefined,
  redisHost: process.env.REDIS_HOST ?? "localhost",
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisTls: process.env.REDIS_TLS === "true",
  nodeEnv: process.env.NODE_ENV ?? "development",
  allowPrivateWebhookTargets: process.env.ALLOW_PRIVATE_WEBHOOK_TARGETS === "true",
};
