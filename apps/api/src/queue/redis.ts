import IORedis from "ioredis";
import { config } from "../config";

export function createRedisConnection(): IORedis {
  return new IORedis({
    host: config.redisHost,
    port: config.redisPort,
    password: config.redisPassword,
    tls: config.redisTls ? {} : undefined,
    maxRetriesPerRequest: null,
  });
}
