import { BaseAgent } from "./BaseAgent";
import type { AgentTask, AgentResult } from "./types";
import { DependencyExecutor } from "./DependencyExecutor";

export class MultiAgentExecutor {
  private deps = new DependencyExecutor();

  constructor(private agents: BaseAgent[]) {}

  async executeTasks(tasks: AgentTask[]): Promise<AgentResult[]> {
    const completed = new Set<string>();
    const results: AgentResult[] = [];
    const remaining = [...tasks];

    while (remaining.length > 0) {
      const ready = remaining.filter((t) => this.deps.canRun(t, completed));
      if (ready.length === 0) {
        // Circular / unresolved deps — fail the rest
        for (const t of remaining) {
          results.push({
            taskId: t.id,
            agent: "none",
            success: false,
            error: "Unresolved dependencies",
          });
        }
        break;
      }

      const batch = await Promise.all(ready.map((t) => this.executeTask(t)));
      for (const r of batch) {
        results.push(r);
        completed.add(r.taskId);
      }
      for (const t of ready) {
        const idx = remaining.indexOf(t);
        if (idx >= 0) remaining.splice(idx, 1);
      }
    }

    return results;
  }

  private async executeTask(task: AgentTask): Promise<AgentResult> {
    const agent = this.agents.find((a) => a.canHandle(task));
    if (!agent) {
      return { taskId: task.id, agent: "none", success: false, error: "No matching agent" };
    }
    try {
      agent.status = "RUNNING";
      const result = await agent.execute(task);
      agent.status = result.success ? "COMPLETE" : "FAILED";
      return result;
    } catch (err: any) {
      agent.status = "FAILED";
      return { taskId: task.id, agent: agent.name, success: false, error: err?.message ?? String(err) };
    }
  }
}