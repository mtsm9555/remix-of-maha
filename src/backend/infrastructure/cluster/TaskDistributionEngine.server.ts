import type { ClusterTask, ClusterMetrics, TaskPriority, TaskStatus, WorkerNode } from "./ClusterTypes";
import { mapWorker, type WorkerRow } from "./WorkerRegistry.server";

type TaskRow = {
  id: string; type: string; priority: TaskPriority;
  required_capabilities: string[]; preferred_region: string | null; preferred_worker_id: string | null;
  payload: Record<string, unknown>; status: TaskStatus; assigned_worker_id: string | null;
  queued_at: string; started_at: string | null; completed_at: string | null;
  attempts: number; max_attempts: number; timeout_ms: number;
  result: unknown; error: string | null;
  tenant_id: string; workspace_id: string | null; metadata: Record<string, unknown> | null;
};

function mapTask(r: TaskRow): ClusterTask {
  return {
    id: r.id, type: r.type, priority: r.priority,
    requiredCapabilities: r.required_capabilities ?? [],
    preferredRegion: r.preferred_region ?? undefined,
    preferredWorkerId: r.preferred_worker_id ?? undefined,
    payload: r.payload ?? {}, status: r.status,
    assignedWorkerId: r.assigned_worker_id ?? undefined,
    queuedAt: new Date(r.queued_at),
    startedAt: r.started_at ? new Date(r.started_at) : undefined,
    completedAt: r.completed_at ? new Date(r.completed_at) : undefined,
    attempts: r.attempts, maxAttempts: r.max_attempts, timeoutMs: r.timeout_ms,
    result: r.result ?? undefined, error: r.error ?? undefined,
    tenantId: r.tenant_id, workspaceId: r.workspace_id ?? undefined,
    metadata: r.metadata ?? {},
  };
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = { critical: 100, high: 50, normal: 10, low: 1 };

export class TaskDistributionEngine {
  static async submitTask(
    type: string,
    payload: Record<string, unknown>,
    options: {
      priority?: TaskPriority;
      requiredCapabilities?: string[];
      preferredRegion?: string;
      preferredWorkerId?: string;
      timeoutMs?: number;
      maxAttempts?: number;
      tenantId: string;
      workspaceId?: string;
      metadata?: Record<string, unknown>;
    },
  ): Promise<ClusterTask> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `task_${crypto.randomUUID()}`;
    const { data, error } = await supabaseAdmin.from("cluster_tasks" as never).insert({
      id, type, priority: options.priority ?? "normal",
      required_capabilities: options.requiredCapabilities ?? [],
      preferred_region: options.preferredRegion ?? null,
      preferred_worker_id: options.preferredWorkerId ?? null,
      payload, status: "pending", attempts: 0,
      max_attempts: options.maxAttempts ?? 3,
      timeout_ms: options.timeoutMs ?? 300_000,
      tenant_id: options.tenantId,
      workspace_id: options.workspaceId ?? null,
      metadata: options.metadata ?? {},
      queued_at: new Date().toISOString(),
    } as never).select().single();
    if (error) throw new Error(error.message);
    const task = mapTask(data as unknown as TaskRow);
    await this.tryAssignTask(task.id);
    return task;
  }

  static async tryAssignTask(taskId: string): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: taskData } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("*").eq("id", taskId).eq("status", "pending").maybeSingle();
    if (!taskData) return false;
    const task = mapTask(taskData as unknown as TaskRow);

    const suitable = await this.findSuitableWorkers(task);
    if (suitable.length === 0) return false;
    const best = this.selectBestWorker(suitable, task);
    if (!best) return false;

    const { error } = await supabaseAdmin.from("cluster_tasks" as never).update({
      status: "queued", assigned_worker_id: best.id,
    } as never).eq("id", taskId).eq("status", "pending");
    if (error) return false;

    await supabaseAdmin.from("worker_nodes" as never).update({
      current_task_count: best.currentTaskCount + 1,
      status: (best.currentTaskCount + 1) >= best.maxConcurrentTasks ? "busy" : best.status,
      updated_at: new Date().toISOString(),
    } as never).eq("id", best.id);
    return true;
  }

  static async claimNextTask(workerId: string, capabilities: string[]): Promise<ClusterTask | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("*").eq("status", "queued").eq("assigned_worker_id", workerId)
      .order("queued_at", { ascending: true }).limit(1).maybeSingle();
    if (!data) return null;
    const task = mapTask(data as unknown as TaskRow);
    const hasCaps = task.requiredCapabilities.every((c) => capabilities.includes(c));
    if (!hasCaps) return null;
    const now = new Date().toISOString();
    await supabaseAdmin.from("cluster_tasks" as never).update({
      status: "running", started_at: now, attempts: task.attempts + 1,
    } as never).eq("id", task.id);
    return { ...task, status: "running", startedAt: new Date(now), attempts: task.attempts + 1 };
  }

  static async completeTask(taskId: string, result: unknown): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("assigned_worker_id").eq("id", taskId).maybeSingle();
    await supabaseAdmin.from("cluster_tasks" as never).update({
      status: "completed", completed_at: new Date().toISOString(),
      result: (result ?? null) as never,
    } as never).eq("id", taskId);
    const wid = (data as { assigned_worker_id: string | null } | null)?.assigned_worker_id;
    if (wid) await this.decrementWorkerLoad(wid);
  }

  static async failTask(taskId: string, errorMessage: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("attempts, max_attempts, assigned_worker_id").eq("id", taskId).maybeSingle();
    if (!data) return;
    const d = data as { attempts: number; max_attempts: number; assigned_worker_id: string | null };
    const retry = d.attempts < d.max_attempts;
    await supabaseAdmin.from("cluster_tasks" as never).update({
      status: retry ? "pending" : "failed",
      error: errorMessage,
      assigned_worker_id: retry ? null : d.assigned_worker_id,
      completed_at: retry ? null : new Date().toISOString(),
    } as never).eq("id", taskId);
    if (d.assigned_worker_id) await this.decrementWorkerLoad(d.assigned_worker_id);
    if (retry) await this.tryAssignTask(taskId);
  }

  static async cancelTask(taskId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("assigned_worker_id, status").eq("id", taskId).maybeSingle();
    await supabaseAdmin.from("cluster_tasks" as never).update({
      status: "cancelled", completed_at: new Date().toISOString(),
    } as never).eq("id", taskId).in("status", ["pending", "queued", "running"]);
    const d = data as { assigned_worker_id: string | null; status: TaskStatus } | null;
    if (d?.assigned_worker_id && d.status !== "completed") await this.decrementWorkerLoad(d.assigned_worker_id);
  }

  private static async decrementWorkerLoad(workerId: string): Promise<void> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("worker_nodes" as never)
      .select("current_task_count, max_concurrent_tasks, status").eq("id", workerId).maybeSingle();
    if (!data) return;
    const w = data as { current_task_count: number; max_concurrent_tasks: number; status: string };
    const next = Math.max(0, w.current_task_count - 1);
    await supabaseAdmin.from("worker_nodes" as never).update({
      current_task_count: next,
      status: w.status === "busy" && next < w.max_concurrent_tasks ? "idle" : w.status,
      updated_at: new Date().toISOString(),
    } as never).eq("id", workerId);
  }

  private static async findSuitableWorkers(task: ClusterTask): Promise<WorkerNode[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("worker_nodes" as never)
      .select("*").in("status", ["idle", "busy"]);
    if (task.requiredCapabilities.length > 0) q = q.contains("capabilities", task.requiredCapabilities);
    if (task.preferredWorkerId) q = q.eq("id", task.preferredWorkerId);
    const { data } = await q;
    const workers = ((data ?? []) as unknown as WorkerRow[]).map(mapWorker);
    return workers.filter((w) => w.currentTaskCount < w.maxConcurrentTasks);
  }

  private static selectBestWorker(workers: WorkerNode[], task: ClusterTask): WorkerNode | null {
    if (workers.length === 0) return null;
    const scored = workers.map((w) => {
      const capacity = 1 - w.currentTaskCount / w.maxConcurrentTasks;
      const regionBonus = task.preferredRegion && w.region === task.preferredRegion ? 0.5 : 0;
      const loadPenalty = w.loadAverage;
      const score = capacity * (1 + PRIORITY_WEIGHT[task.priority] / 100) + regionBonus - loadPenalty;
      return { w, score };
    }).sort((a, b) => b.score - a.score);
    return scored[0]?.w ?? null;
  }

  static async getTask(taskId: string): Promise<ClusterTask | null> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("*").eq("id", taskId).maybeSingle();
    return data ? mapTask(data as unknown as TaskRow) : null;
  }

  static async listTasks(filter: { tenantId?: string; workerId?: string; status?: TaskStatus; limit?: number } = {}): Promise<ClusterTask[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin.from("cluster_tasks" as never).select("*")
      .order("queued_at", { ascending: false }).limit(filter.limit ?? 50);
    if (filter.tenantId) q = q.eq("tenant_id", filter.tenantId);
    if (filter.workerId) q = q.eq("assigned_worker_id", filter.workerId);
    if (filter.status) q = q.eq("status", filter.status);
    const { data } = await q;
    return ((data ?? []) as unknown as TaskRow[]).map(mapTask);
  }

  static async getClusterMetrics(): Promise<ClusterMetrics> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: workers } = await supabaseAdmin.from("worker_nodes" as never).select("*");
    const { data: tasks } = await supabaseAdmin.from("cluster_tasks" as never)
      .select("status, assigned_worker_id");
    const ws = ((workers ?? []) as unknown as WorkerRow[]).map(mapWorker);
    const ts = ((tasks ?? []) as unknown as Array<{ status: TaskStatus; assigned_worker_id: string | null }>);
    const activeWs = ws.filter((w) => w.status === "idle" || w.status === "busy");

    const regionMetrics: Record<string, { workers: number; tasks: number; load: number }> = {};
    for (const w of ws) {
      const r = (regionMetrics[w.region] ??= { workers: 0, tasks: 0, load: 0 });
      r.workers += 1; r.load += w.loadAverage; r.tasks += w.currentTaskCount;
    }
    for (const key of Object.keys(regionMetrics)) {
      const r = regionMetrics[key]!;
      r.load = r.workers > 0 ? r.load / r.workers : 0;
    }

    return {
      totalWorkers: ws.length,
      activeWorkers: activeWs.length,
      idleWorkers: ws.filter((w) => w.status === "idle").length,
      failedWorkers: ws.filter((w) => w.status === "failed").length,
      totalTasks: ts.length,
      pendingTasks: ts.filter((t) => t.status === "pending" || t.status === "queued").length,
      runningTasks: ts.filter((t) => t.status === "running").length,
      completedTasks: ts.filter((t) => t.status === "completed").length,
      failedTasks: ts.filter((t) => t.status === "failed").length,
      averageLoad: activeWs.length > 0 ? activeWs.reduce((s, w) => s + w.loadAverage, 0) / activeWs.length : 0,
      regionMetrics,
    };
  }
}