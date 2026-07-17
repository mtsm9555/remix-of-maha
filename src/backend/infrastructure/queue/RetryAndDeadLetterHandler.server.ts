import type { DeadLetterTask, OrchestratedTask, RetryPolicy } from "./QueueOrchestrationTypes";

const POLICIES: Record<string, RetryPolicy> = {
  critical: { strategy: "exponential_backoff", maxAttempts: 5, initialDelayMs: 1000, maxDelayMs: 60000, multiplier: 2, jitter: true },
  normal: { strategy: "exponential_backoff", maxAttempts: 3, initialDelayMs: 2000, maxDelayMs: 300000, multiplier: 2, jitter: true },
  background: { strategy: "exponential_backoff", maxAttempts: 2, initialDelayMs: 5000, maxDelayMs: 3600000, multiplier: 2, jitter: true },
  batch: { strategy: "fixed_delay", maxAttempts: 3, initialDelayMs: 60000, maxDelayMs: 60000, multiplier: 1, jitter: false },
};

function delayFor(policy: RetryPolicy, attempt: number): number {
  let delay: number;
  switch (policy.strategy) {
    case "exponential_backoff":
      delay = Math.min(policy.initialDelayMs * policy.multiplier ** (attempt - 1), policy.maxDelayMs);
      break;
    case "linear_backoff":
      delay = Math.min(policy.initialDelayMs * attempt, policy.maxDelayMs);
      break;
    case "fixed_delay":
      delay = policy.initialDelayMs;
      break;
    default:
      return 0;
  }
  if (policy.jitter) {
    const j = delay * 0.2;
    delay += Math.random() * j * 2 - j;
  }
  return Math.round(delay);
}

export class RetryAndDeadLetterHandler {
  static async handleTaskFailure(
    task: OrchestratedTask,
    error: string,
    errorCode?: string,
  ): Promise<{ action: "retried" | "dead_lettered"; nextRetryAt?: Date }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const attempts = task.attempts + 1;
    if (attempts < task.maxAttempts) {
      const { data: queue } = await supabaseAdmin.from("queues").select("type").eq("id", task.queueId).maybeSingle();
      const policy = POLICIES[(queue as any)?.type ?? "normal"] ?? POLICIES.normal;
      const nextRetryAt = new Date(Date.now() + delayFor(policy, attempts));
      await supabaseAdmin
        .from("orchestrated_tasks")
        .update({
          state: "pending",
          attempts,
          error,
          error_code: errorCode ?? null,
          next_retry_at: nextRetryAt.toISOString(),
          started_at: null,
          completed_at: null,
        })
        .eq("id", task.id);
      return { action: "retried", nextRetryAt };
    }
    await this.moveToDeadLetterQueue(task, error, errorCode ?? "MAX_RETRIES_EXCEEDED");
    return { action: "dead_lettered" };
  }

  private static async moveToDeadLetterQueue(task: OrchestratedTask, error: string, errorCode: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("dead_letter_queue").insert({
      id: `dlq_${crypto.randomUUID()}`,
      original_task_id: task.id,
      queue_id: task.queueId,
      tenant_id: task.tenantId,
      type: task.type,
      payload: task.payload,
      priority: task.priority,
      attempts: task.attempts,
      last_error: error,
      last_error_code: errorCode,
      failed_at: new Date().toISOString(),
      metadata: task.metadata,
    });
    await supabaseAdmin
      .from("orchestrated_tasks")
      .update({
        state: "dead_letter",
        attempts: task.attempts + 1,
        error,
        error_code: errorCode,
        completed_at: new Date().toISOString(),
      })
      .eq("id", task.id);
  }

  static async retryDeadLetterTask(deadLetterId: string, retriedBy: string): Promise<string | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dl } = await supabaseAdmin
      .from("dead_letter_queue")
      .select("*")
      .eq("id", deadLetterId)
      .eq("can_retry", true)
      .maybeSingle();
    if (!dl) return null;
    const d = dl as any;
    if (d.retry_count >= d.max_manual_retries) return null;
    const newId = `task_${crypto.randomUUID()}`;
    await supabaseAdmin.from("orchestrated_tasks").insert({
      id: newId,
      queue_id: d.queue_id,
      tenant_id: d.tenant_id,
      type: d.type,
      payload: d.payload,
      priority: d.priority,
      state: "pending",
      max_attempts: 3,
      metadata: { ...(d.metadata ?? {}), retriedFromDeadLetter: true, originalTaskId: d.original_task_id, retriedBy },
    });
    await supabaseAdmin
      .from("dead_letter_queue")
      .update({
        retry_count: d.retry_count + 1,
        can_retry: d.retry_count + 1 < d.max_manual_retries,
      })
      .eq("id", deadLetterId);
    return newId;
  }

  static async getDeadLetterTasks(tenantId: string, limit = 50): Promise<DeadLetterTask[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("dead_letter_queue")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("failed_at", { ascending: false })
      .limit(limit);
    return ((data ?? []) as any[]).map((d) => ({
      id: d.id,
      originalTaskId: d.original_task_id,
      queueId: d.queue_id,
      tenantId: d.tenant_id,
      type: d.type,
      payload: d.payload,
      priority: d.priority,
      attempts: d.attempts,
      lastError: d.last_error,
      lastErrorCode: d.last_error_code,
      failedAt: new Date(d.failed_at),
      canRetry: d.can_retry,
      retryCount: d.retry_count,
      maxManualRetries: d.max_manual_retries,
      metadata: d.metadata ?? {},
      createdAt: new Date(d.created_at),
    }));
  }

  static async purgeOldDeadLetterTasks(daysOld = 30): Promise<number> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date(Date.now() - daysOld * 86_400_000).toISOString();
    const { data } = await supabaseAdmin
      .from("dead_letter_queue")
      .select("id")
      .lt("created_at", cutoff)
      .eq("can_retry", false);
    const ids = ((data ?? []) as any[]).map((r) => r.id);
    if (ids.length === 0) return 0;
    await supabaseAdmin.from("dead_letter_queue").delete().in("id", ids);
    return ids.length;
  }
}