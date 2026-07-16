import type {
  AgentInstance,
  AgentInstanceConfig,
  AgentInstanceState,
  LifecycleEvent,
} from "./AgentLifecycleTypes";

export class AgentLifecycleManager {
  private static instances: Map<string, AgentInstance> = new Map();
  private static lifecycleEvents: LifecycleEvent[] = [];

  static spawnInstance(config: AgentInstanceConfig): AgentInstance {
    const instanceId = `inst_${config.agentId}_${crypto.randomUUID().substring(0, 8)}`;
    const instance: AgentInstance = {
      instanceId,
      config,
      state: "INITIALIZING",
      tasksCompleted: 0,
      consecutiveErrors: 0,
      createdAt: new Date(),
      stateChangedAt: new Date(),
      lastHeartbeat: new Date(),
    };
    this.instances.set(instanceId, instance);
    this.transitionState(instanceId, "IDLE", "Instance spawned and initialized.");
    return instance;
  }

  static assignTask(instanceId: string, taskId: string): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== "IDLE") return false;
    instance.currentTaskId = taskId;
    instance.taskStartTime = new Date();
    this.transitionState(instanceId, "WORKING", `Assigned task ${taskId}`);
    return true;
  }

  static completeTask(instanceId: string, success: boolean) {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== "WORKING") return;
    instance.currentTaskId = undefined;
    instance.taskStartTime = undefined;
    instance.tasksCompleted++;
    instance.consecutiveErrors = success ? 0 : instance.consecutiveErrors + 1;
    this.transitionState(instanceId, "IDLE", success ? "Task completed successfully" : "Task failed");
  }

  static async drainAndDestroy(instanceId: string, reason: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    if (instance.state === "WORKING") {
      this.transitionState(instanceId, "DRAINING", `Draining: ${reason}`);
      setTimeout(() => this.forceDestroy(instanceId, "Drain complete"), 5000);
    } else {
      this.forceDestroy(instanceId, reason);
    }
  }

  static forceDestroy(instanceId: string, reason: string) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    this.transitionState(instanceId, "DESTROYED", reason);
    this.instances.delete(instanceId);
  }

  static pauseInstance(instanceId: string, reason: string) {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== "IDLE") return;
    this.transitionState(instanceId, "PAUSED", reason);
  }

  static resumeInstance(instanceId: string) {
    const instance = this.instances.get(instanceId);
    if (!instance || instance.state !== "PAUSED") return;
    this.transitionState(instanceId, "IDLE", "Resumed by lifecycle manager");
  }

  static getActiveInstances(): AgentInstance[] {
    return Array.from(this.instances.values());
  }

  static getRecentEvents(limit = 100): LifecycleEvent[] {
    return this.lifecycleEvents.slice(-limit).reverse();
  }

  private static transitionState(
    instanceId: string,
    newState: AgentInstanceState,
    reason: string,
  ) {
    const instance = this.instances.get(instanceId);
    if (!instance) return;
    const oldState = instance.state;
    if (!this.isValidTransition(oldState, newState)) {
      console.error(`[Lifecycle] Invalid transition: ${oldState} -> ${newState} for ${instanceId}`);
      return;
    }
    instance.state = newState;
    instance.stateChangedAt = new Date();
    instance.lastHeartbeat = new Date();
    const event: LifecycleEvent = {
      id: `evt_${crypto.randomUUID()}`,
      instanceId,
      fromState: oldState,
      toState: newState,
      reason,
      timestamp: new Date(),
    };
    this.lifecycleEvents.push(event);
    if (this.lifecycleEvents.length > 500) this.lifecycleEvents.splice(0, this.lifecycleEvents.length - 500);
    void this.persistLifecycleEvent(event);
  }

  private static isValidTransition(from: AgentInstanceState, to: AgentInstanceState): boolean {
    const valid: Record<AgentInstanceState, AgentInstanceState[]> = {
      INITIALIZING: ["IDLE", "UNHEALTHY", "DESTROYED"],
      IDLE: ["WORKING", "PAUSED", "DRAINING", "DESTROYED"],
      WORKING: ["IDLE", "DRAINING", "UNHEALTHY", "DESTROYED"],
      DRAINING: ["DESTROYED"],
      PAUSED: ["IDLE", "DESTROYED"],
      UNHEALTHY: ["DESTROYED"],
      DESTROYED: [],
    };
    return valid[from].includes(to);
  }

  private static async persistLifecycleEvent(event: LifecycleEvent) {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await (supabaseAdmin as any).from("agent_lifecycle_logs").insert({
        instance_id: event.instanceId,
        from_state: event.fromState,
        to_state: event.toState,
        reason: event.reason,
        timestamp: event.timestamp.toISOString(),
      });
    } catch (err) {
      console.error("[Lifecycle] Failed to persist event:", err);
    }
  }
}