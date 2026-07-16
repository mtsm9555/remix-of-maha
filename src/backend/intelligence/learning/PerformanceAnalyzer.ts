import type { Department } from "../../agents/departments/types";
import type { AgentPerformanceMetrics } from "./LearningTypes";

export class PerformanceAnalyzer {
  static async analyzePerformance(
    agentId: string,
    department: Department,
    daysLookback = 14,
  ): Promise<AgentPerformanceMetrics> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - daysLookback);

    const { data } = await supabaseAdmin
      .from("tasks" as any)
      .select("status, metadata")
      .eq("assigned_agent_id" as any, agentId)
      .gte("updated_at", cutoff.toISOString());

    const tasks = (data as any[]) || [];
    if (tasks.length === 0) return this.defaults(agentId, department);

    const total = tasks.length;
    const succeeded = tasks.filter((t) => t.status === "completed").length;
    const overrides = tasks.filter((t) => t.metadata?.human_override === true).length;
    const avgQa =
      tasks.reduce((s, t) => s + (t.metadata?.qa_score || 0), 0) / total;
    const avgRefl =
      tasks.reduce((s, t) => s + (t.metadata?.reflection_iterations || 1), 0) / total;

    const successRate = succeeded / total;
    const humanOverrideRate = overrides / total;
    const trend: AgentPerformanceMetrics["trend"] =
      successRate > 0.85 && humanOverrideRate < 0.05
        ? "improving"
        : successRate < 0.6
          ? "degrading"
          : "stable";

    return {
      agentId,
      department,
      totalTasks: total,
      successRate,
      averageQAScore: avgQa,
      averageReflectionIterations: avgRefl,
      humanOverrideRate,
      trend,
    };
  }

  private static defaults(agentId: string, department: Department): AgentPerformanceMetrics {
    return {
      agentId,
      department,
      totalTasks: 0,
      successRate: 0,
      averageQAScore: 0,
      averageReflectionIterations: 0,
      humanOverrideRate: 0,
      trend: "stable",
    };
  }
}