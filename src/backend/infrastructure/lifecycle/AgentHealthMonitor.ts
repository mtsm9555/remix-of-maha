import { AgentLifecycleManager } from "./AgentLifecycleManager";
import type { AgentInstanceConfig } from "./AgentLifecycleTypes";

/**
 * Stateless health check. Cloudflare Workers can't run background intervals,
 * so this is invoked on-demand (e.g. via a cron-hit endpoint).
 */
export class AgentHealthMonitor {
  private static readonly ZOMBIE_THRESHOLD_MS = 10 * 60 * 1000;
  private static readonly ERROR_THRESHOLD = 5;

  static runHealthSweep(config?: AgentInstanceConfig): {
    zombiesKilled: number;
    unhealthyKilled: number;
    idlePaused: number;
  } {
    let zombiesKilled = 0;
    let unhealthyKilled = 0;
    let idlePaused = 0;

    const instances = AgentLifecycleManager.getActiveInstances().filter(
      (i) => (!config || i.config.agentId === config.agentId) && i.state !== "DESTROYED",
    );

    for (const instance of instances) {
      if (instance.state === "WORKING" && instance.taskStartTime) {
        const duration = Date.now() - instance.taskStartTime.getTime();
        if (duration > this.ZOMBIE_THRESHOLD_MS) {
          AgentLifecycleManager.forceDestroy(instance.instanceId, "Zombie timeout (task took too long)");
          zombiesKilled++;
          continue;
        }
      }
      if (instance.consecutiveErrors >= this.ERROR_THRESHOLD) {
        AgentLifecycleManager.forceDestroy(
          instance.instanceId,
          `Consecutive error threshold reached (${this.ERROR_THRESHOLD})`,
        );
        unhealthyKilled++;
        continue;
      }
      if (instance.state === "IDLE") {
        const idleTime = Date.now() - instance.stateChangedAt.getTime();
        if (idleTime > instance.config.maxIdleTimeMinutes * 60 * 1000) {
          AgentLifecycleManager.pauseInstance(instance.instanceId, "Idle timeout");
          idlePaused++;
        }
      }
    }

    return { zombiesKilled, unhealthyKilled, idlePaused };
  }

  static autoScale(
    config: AgentInstanceConfig,
    waitingCount: number,
    minBaseline = 2,
    maxSpawnPerTick = 3,
  ): { spawned: number; drained: number } {
    let spawned = 0;
    let drained = 0;

    const active = AgentLifecycleManager.getActiveInstances().filter(
      (i) => i.config.agentId === config.agentId && (i.state === "IDLE" || i.state === "WORKING"),
    );
    const idleInstances = active.filter((i) => i.state === "IDLE");

    if (waitingCount > idleInstances.length) {
      const toSpawn = Math.min(waitingCount - idleInstances.length, maxSpawnPerTick);
      for (let i = 0; i < toSpawn; i++) {
        AgentLifecycleManager.spawnInstance(config);
        spawned++;
      }
    }

    if (waitingCount === 0 && idleInstances.length > minBaseline) {
      const toDestroy = idleInstances.slice(0, idleInstances.length - minBaseline);
      for (const instance of toDestroy) {
        AgentLifecycleManager.drainAndDestroy(instance.instanceId, "Auto-scale down (queue empty)");
        drained++;
      }
    }

    return { spawned, drained };
  }
}