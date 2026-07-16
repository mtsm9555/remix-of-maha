import { AgentRegistryStore } from "../infrastructure/registry/AgentRegistryStore";
import { HealthAggregator } from "../infrastructure/health/HealthAggregator";

/**
 * Stateless health sweep. Invoke via `POST /api/infrastructure/health/sweep`
 * (from an external cron); the Worker runtime cannot host a `setInterval` loop.
 */
export class HealthMonitorWorker {
  static async runHealthChecks(): Promise<{ evaluated: number }> {
    const agents = await AgentRegistryStore.searchAgents({});
    const active = agents.filter((a) => a.status !== "offline");

    const batchSize = 10;
    for (let i = 0; i < active.length; i += batchSize) {
      const batch = active.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (agent) => {
          try {
            await HealthAggregator.evaluateInstanceHealth(agent.instanceId);
          } catch (error) {
            console.error(`[HealthWorker] Failed for ${agent.instanceId}:`, error);
          }
        }),
      );
    }
    return { evaluated: active.length };
  }
}