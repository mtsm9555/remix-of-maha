export type HealthState = "healthy" | "degraded" | "down";

export class HealthMonitor {
  async check(): Promise<Record<string, HealthState>> {
    return {
      api: "healthy",
      database: "healthy",
      redis: "healthy",
      models: "healthy",
      queue: "healthy",
    };
  }
}