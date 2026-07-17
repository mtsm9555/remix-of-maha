import type { TaskDependency } from "./QueueOrchestrationTypes";

export class TaskDependencyResolver {
  static async createDependency(
    taskId: string,
    dependsOnTaskId: string,
    dependencyType: TaskDependency["dependencyType"] = "blocking",
    condition?: string,
  ): Promise<TaskDependency> {
    if (await this.detectCircularDependency(taskId, dependsOnTaskId)) {
      throw new Error(`Circular dependency: ${taskId} <-> ${dependsOnTaskId}`);
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const id = `dep_${crypto.randomUUID()}`;
    await supabaseAdmin.from("task_dependencies").insert({
      id,
      task_id: taskId,
      depends_on_task_id: dependsOnTaskId,
      dependency_type: dependencyType,
      condition: condition ?? null,
    });
    return { id, taskId, dependsOnTaskId, dependencyType, condition, createdAt: new Date() };
  }

  static async detectCircularDependency(taskId: string, dependsOnTaskId: string): Promise<boolean> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("task_dependencies").select("task_id,depends_on_task_id");
    const graph = new Map<string, string[]>();
    for (const dep of (data ?? []) as any[]) {
      if (!graph.has(dep.task_id)) graph.set(dep.task_id, []);
      graph.get(dep.task_id)!.push(dep.depends_on_task_id);
    }
    if (!graph.has(taskId)) graph.set(taskId, []);
    graph.get(taskId)!.push(dependsOnTaskId);
    const visited = new Set<string>();
    const stack = new Set<string>();
    const dfs = (n: string): boolean => {
      visited.add(n);
      stack.add(n);
      for (const nb of graph.get(n) ?? []) {
        if (!visited.has(nb)) {
          if (dfs(nb)) return true;
        } else if (stack.has(nb)) return true;
      }
      stack.delete(n);
      return false;
    };
    return dfs(taskId);
  }

  static async areDependenciesSatisfied(taskId: string): Promise<{ satisfied: boolean; blockingTasks: string[] }> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: deps } = await supabaseAdmin
      .from("task_dependencies")
      .select("*")
      .eq("task_id", taskId)
      .is("resolved_at", null);
    if (!deps || deps.length === 0) return { satisfied: true, blockingTasks: [] };
    const blocking: string[] = [];
    for (const dep of deps as any[]) {
      const { data: t } = await supabaseAdmin
        .from("orchestrated_tasks")
        .select("state")
        .eq("id", dep.depends_on_task_id)
        .maybeSingle();
      if ((!t || (t as any).state !== "completed") && dep.dependency_type === "blocking") {
        blocking.push(dep.depends_on_task_id);
      }
    }
    return { satisfied: blocking.length === 0, blockingTasks: blocking };
  }

  static async resolveDependencies(completedTaskId: string): Promise<string[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: dependents } = await supabaseAdmin
      .from("task_dependencies")
      .select("task_id")
      .eq("depends_on_task_id", completedTaskId)
      .is("resolved_at", null);
    const unblocked: string[] = [];
    for (const dep of (dependents ?? []) as any[]) {
      await supabaseAdmin
        .from("task_dependencies")
        .update({ resolved_at: new Date().toISOString() })
        .eq("task_id", dep.task_id)
        .eq("depends_on_task_id", completedTaskId);
      const { satisfied } = await this.areDependenciesSatisfied(dep.task_id);
      if (satisfied) {
        unblocked.push(dep.task_id);
        await supabaseAdmin
          .from("orchestrated_tasks")
          .update({ state: "queued", queued_at: new Date().toISOString() })
          .eq("id", dep.task_id);
      }
    }
    return unblocked;
  }
}