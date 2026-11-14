import IORedis from "ioredis";
import { config } from "../config";

export function createRedisConnection(): IORedis {
  if (config.redisUrl) {
    return new IORedis(config.redisUrl, { maxRetriesPerRequest: null });
  }

  return new IORedis({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    tls: config.redisTls ? {} : undefined,
    maxRetriesPerRequest: null,
  });
}
