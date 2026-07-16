// src/backend/workers/WorkerService.ts
// Entrypoint: `bun run src/backend/workers/WorkerService.ts`
// Requires a running Redis (REDIS_HOST/REDIS_PORT/REDIS_PASSWORD).
import { RedisManager } from "./RedisManager";
import { WorkerPool } from "./WorkerPool";
import { Autoscaler } from "./Autoscaler";

export class WorkerService {
  static async start() {
    console.log("[WorkerService] Starting worker service...");
    const isHealthy = await RedisManager.isHealthy();
    if (!isHealthy) throw new Error("Redis is not healthy. Cannot start worker service.");
    WorkerPool.startAllWorkers();
    Autoscaler.start();
    console.log("[WorkerService] Worker service started successfully");
  }

  static async shutdown() {
    console.log("[WorkerService] Shutting down worker service...");
    Autoscaler.stop();
    await WorkerPool.shutdown();
    await RedisManager.disconnect();
    console.log("[WorkerService] Worker service shutdown complete");
  }
}

// Auto-start when invoked directly.
if (import.meta.main) {
  WorkerService.start().catch((err) => {
    console.error("[WorkerService] Fatal:", err);
    process.exit(1);
  });

  const shutdown = async () => {
    await WorkerService.shutdown();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}