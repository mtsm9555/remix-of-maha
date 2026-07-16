// src/backend/workers/RedisManager.ts
// NOTE: Node.js-only. Run in a separate `bun run` process, not in the Worker/SSR bundle.
import { Redis } from "ioredis";

export function getRedisOptions() {
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379"),
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null as null,
  };
}

export class RedisManager {
  private static connection: Redis | null = null;

  static getConnection(): Redis {
    if (!this.connection) {
      this.connection = new Redis({
        ...getRedisOptions(),
        retryStrategy: (times) => {
          if (times > 3) {
            console.error("[RedisManager] Max retry attempts reached");
            return null;
          }
          return Math.min(times * 200, 2000);
        },
      });

      this.connection.on("error", (err) => {
        console.error("[RedisManager] Redis connection error:", err);
      });
      this.connection.on("connect", () => {
        console.log("[RedisManager] Redis connected successfully");
      });
    }
    return this.connection;
  }

  static async isHealthy(): Promise<boolean> {
    try {
      await this.getConnection().ping();
      return true;
    } catch {
      return false;
    }
  }

  static async disconnect() {
    if (this.connection) {
      await this.connection.quit();
      this.connection = null;
    }
  }
}