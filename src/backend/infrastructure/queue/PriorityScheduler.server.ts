import type { OrchestratedTask, PriorityLevel } from "./QueueOrchestrationTypes";
import { TaskDependencyResolver } from "./TaskDependencyResolver.server";

function mapToTask(r: any): OrchestratedTask {
  return {
    id: r.id,
    queueId: r.queue_id,
    tenantId: r.tenant_id,
    workspaceId: r.workspace_id ?? undefined,
    type: r.type,
    payload: r.payload ?? {},
    priority: r.priority as PriorityLevel,
    state: r.state,
    attempts: r.attempts,
    maxAttempts: r.max_attempts,
    createdAt: new Date(r.created_at),
    queuedAt: r.queued_at ? new Date(r.queued_at) : undefined,
    startedAt: r.started_at ? new Date(r.started_at) : undefined,
    completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
    timeoutMs: r.timeout_ms,
    retryStrategy: r.retry_strategy,
    retryDelayMs: r.retry_delay_ms,
    nextRetryAt: r.next_retry_at ? new Date(r.next_retry_at) : undefined,
    result: r.result ?? undefined,
    error: r.error ?? undefined,
    errorCode: r.error_code ?? undefined,
    dependsOn: r.depends_on ?? [],
    metadata: r.metadata ?? {},
    correlationId: r.correlation_id ?? undefined,
  };
}

function priorityScore(task: OrchestratedTask): number {
  const ageMin = (Date.now() - task.createdAt.getTime()) / 60_000;
  return (6 - task.priority) * 1000 + ageMin;
}

export interface EnqueueInput {
  queueId: string;
  tenantId: string;
  workspaceId?: string;
  type: string;
  payload?: Record<string, any>;
  priority?: PriorityLevel;
  dependsOn?: string[];
  metadata?: Record<string, any>;
  maxAttempts?: number;
  timeoutMs?: number;
  retryStrategy?: OrchestratedTask["retryStrategy"];
  retryDelayMs?: number;
  correlationId?: string;
}

export class PriorityScheduler {
  static async enqueue(task: EnqueueInput): Promise<string> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `task_${crypto.randomUUID()}`;
    const hasDeps = (task.dependsOn?.length ?? 0) > 0;
    await supabaseAdmin.from("orchestrated_tasks").insert({
      id,
      queue_id: task.queueId,
      tenant_id: task.tenantId,
      workspace_id: task.workspaceId ?? null,
      type: task.type,
      payload: task.payload ?? {},
      priority: task.priority ?? 3,
      state: hasDeps ? "blocked" : "queued",
      queued_at: new Date().toISOString(),
      max_attempts: task.maxAttempts ?? 3,
      timeout_ms: task.timeoutMs ?? 300_000,
      retry_strategy: task.retryStrategy ?? "exponential_backoff",
      retry_delay_ms: task.retryDelayMs ?? 2000,
      depends_on: task.dependsOn ?? [],
      metadata: task.metadata ?? {},
      correlation_id: task.correlationId ?? null,
    });
    for (const depId of task.dependsOn ?? []) {
      await TaskDependencyResolver.createDependency(id, depId, "blocking");
    }
    return id;
  }

  static async getNextTask(queueId: string): Promise<OrchestratedTask | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("orchestrated_tasks")
      .select("*")
      .eq("queue_id", queueId)
      .in("state", ["pending", "queued"])
      .order("created_at", { ascending: true })
      .limit(50);
    if (!data || data.length === 0) return null;
    const scored = (data as any[])
      .map((r) => mapToTask(r))
      .map((t) => ({ t, score: priorityScore(t) }))
      .sort((a, b) => b.score - a.score);
    for (const { t } of scored.slice(0, 10)) {
      const { satisfied } = await TaskDependencyResolver.areDependenciesSatisfied(t.id);
      if (satisfied) {
        await supabaseAdmin
          .from("orchestrated_tasks")
          .update({ state: "processing", started_at: new Date().toISOString() })
          .eq("id", t.id);
        return t;
      }
      await supabaseAdmin.from("orchestrated_tasks").update({ state: "blocked" }).eq("id", t.id);
    }
    return null;
  }

  static async completeTask(taskId: string, result?: unknown): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orchestrated_tasks")
      .update({ state: "completed", completed_at: new Date().toISOString(), result: (result ?? null) as any })
      .eq("id", taskId);
    await TaskDependencyResolver.resolveDependencies(taskId);
  }
}