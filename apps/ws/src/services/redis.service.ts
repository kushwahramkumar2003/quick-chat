import { createClient } from "redis";
import { config } from "../config/config";
import { logger } from "../utils/logger";

const redisClient = createClient({
  url: config.redis.url,
});

redisClient.on("error", (err) => logger.error("Redis Client Error", err));

redisClient.connect().catch((err) => {
  logger.error("Failed to connect to Redis", err);
  process.exit(1);
});

export { redisClient };
