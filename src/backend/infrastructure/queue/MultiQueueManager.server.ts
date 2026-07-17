import type { Queue, QueueType } from "./QueueOrchestrationTypes";

function mapToQueue(d: any): Queue {
  return {
    id: d.id,
    name: d.name,
    type: d.type,
    description: d.description ?? undefined,
    maxConcurrentTasks: d.max_concurrent_tasks,
    defaultTimeoutMs: d.default_timeout_ms,
    defaultMaxRetries: d.default_max_retries,
    defaultRetryStrategy: d.default_retry_strategy,
    isActive: d.is_active,
    currentDepth: d.current_depth,
    processingRate: d.processing_rate,
    failureRate: d.failure_rate,
    tenantId: d.tenant_id ?? undefined,
    createdAt: new Date(d.created_at),
    updatedAt: new Date(d.updated_at),
  };
}

export class MultiQueueManager {
  static async createQueue(
    name: string,
    type: QueueType,
    options: {
      description?: string;
      maxConcurrentTasks?: number;
      defaultTimeoutMs?: number;
      defaultMaxRetries?: number;
      tenantId?: string;
    } = {},
  ): Promise<Queue> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `queue_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin
      .from("queues")
      .insert({
        id,
        name,
        type,
        description: options.description ?? null,
        max_concurrent_tasks: options.maxConcurrentTasks ?? 10,
        default_timeout_ms: options.defaultTimeoutMs ?? 300000,
        default_max_retries: options.defaultMaxRetries ?? 3,
        default_retry_strategy: "exponential_backoff",
        is_active: true,
        tenant_id: options.tenantId ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return mapToQueue(data);
  }

  static async getQueueByType(type: QueueType, tenantId?: string): Promise<Queue | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("queues").select("*").eq("type", type).eq("is_active", true);
    q = tenantId ? q.eq("tenant_id", tenantId) : q.is("tenant_id", null);
    const { data } = await q.maybeSingle();
    return data ? mapToQueue(data) : null;
  }

  static async getQueue(id: string): Promise<Queue | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("queues").select("*").eq("id", id).maybeSingle();
    return data ? mapToQueue(data) : null;
  }

  static async getQueues(tenantId?: string): Promise<Queue[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("queues").select("*").eq("is_active", true);
    q = tenantId ? q.eq("tenant_id", tenantId) : q.is("tenant_id", null);
    const { data } = await q.order("created_at", { ascending: false });
    return (data ?? []).map(mapToQueue);
  }

  static async getQueueForTask(priority: number, taskType: string, tenantId?: string): Promise<Queue> {
    if (priority === 1) {
      const c = await this.getQueueByType("critical", tenantId);
      if (c) return c;
    }
    if (taskType.includes("batch") || taskType.includes("consolidation")) {
      const b = await this.getQueueByType("batch", tenantId);
      if (b) return b;
    }
    if (taskType.includes("scheduled") || taskType.includes("cron")) {
      const s = await this.getQueueByType("scheduled", tenantId);
      if (s) return s;
    }
    const n = await this.getQueueByType("normal", tenantId);
    if (n) return n;
    return this.createQueue("normal", "normal", { tenantId });
  }

  static async updateQueueMetrics(queueId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count: pending } = await supabaseAdmin
      .from("orchestrated_tasks")
      .select("id", { head: true, count: "exact" })
      .eq("queue_id", queueId)
      .in("state", ["pending", "queued"]);
    const oneMinAgo = new Date(Date.now() - 60_000).toISOString();
    const { count: recentCompletions } = await supabaseAdmin
      .from("orchestrated_tasks")
      .select("id", { head: true, count: "exact" })
      .eq("queue_id", queueId)
      .eq("state", "completed")
      .gte("completed_at", oneMinAgo);
    const { count: recentFailures } = await supabaseAdmin
      .from("orchestrated_tasks")
      .select("id", { head: true, count: "exact" })
      .eq("queue_id", queueId)
      .eq("state", "failed")
      .gte("completed_at", oneMinAgo);
    const total = (recentCompletions ?? 0) + (recentFailures ?? 0);
    const failureRate = total > 0 ? (recentFailures ?? 0) / total : 0;
    await supabaseAdmin
      .from("queues")
      .update({
        current_depth: pending ?? 0,
        processing_rate: recentCompletions ?? 0,
        failure_rate: failureRate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", queueId);
  }

  static async pauseQueue(id: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("queues").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", id);
  }
  static async resumeQueue(id: string) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("queues").update({ is_active: true, updated_at: new Date().toISOString() }).eq("id", id);
  }

  static async seedDefaultQueues(): Promise<void> {
    const defs: Array<{ name: string; type: QueueType; description: string }> = [
      { name: "critical", type: "critical", description: "High-priority tasks" },
      { name: "normal", type: "normal", description: "Standard priority tasks" },
      { name: "background", type: "background", description: "Low-priority background tasks" },
      { name: "batch", type: "batch", description: "Batch processing tasks" },
      { name: "scheduled", type: "scheduled", description: "Scheduled/cron tasks" },
    ];
    for (const d of defs) {
      const existing = await this.getQueueByType(d.type);
      if (!existing) await this.createQueue(d.name, d.type, { description: d.description });
    }
  }
}