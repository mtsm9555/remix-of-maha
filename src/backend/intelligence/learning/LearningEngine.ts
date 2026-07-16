import type { Department } from "../../agents/departments/types";
import type { LearningCycle } from "./LearningTypes";
import { PerformanceAnalyzer } from "./PerformanceAnalyzer";
import { PromptOptimizer } from "./PromptOptimizer";
import { PromptVersionControl } from "./PromptVersionControl";

export class LearningEngine {
  static async executeLearningCycle(
    agentId: string,
    department: Department,
    trigger: LearningCycle["trigger"] = "scheduled",
  ): Promise<LearningCycle | null> {
    const current = await PromptVersionControl.getLatestStableVersion(agentId);
    if (!current) return null;

    const metrics = await PerformanceAnalyzer.analyzePerformance(agentId, department);
    if (metrics.trend === "improving" && metrics.successRate > 0.95) return null;

    const failures = await this.fetchRecentFailures(agentId);
    const opt = await PromptOptimizer.optimizePrompt(current, metrics, failures);
    const canary = await PromptVersionControl.deployCanaryVersion(
      agentId,
      opt.newPrompt,
      opt.newFewShots,
      metrics,
    );

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("learning_cycles")
      .insert({
        agent_id: agentId,
        trigger,
        previous_version_id: current.id,
        proposed_version_id: canary.id,
        status: "pending_approval",
        reasoning: opt.reasoning,
      })
      .select()
      .single();

    return {
      id: data.id,
      agentId,
      trigger,
      previousVersionId: current.id,
      proposedVersionId: canary.id,
      status: "pending_approval",
      reasoning: opt.reasoning,
      createdAt: new Date(data.created_at),
    };
  }

  static async evaluateCanaryPerformance(agentId: string, canaryVersionId: string) {
    const canaryMetrics = await PerformanceAnalyzer.analyzePerformance(agentId, "development", 1);
    const previous = (await PromptVersionControl.getLatestStableVersion(agentId))?.performanceMetrics;
    if (!previous) return;

    const successDrop = previous.successRate - canaryMetrics.successRate;
    const overrideSpike = canaryMetrics.humanOverrideRate - previous.humanOverrideRate;

    if (successDrop > 0.1 || overrideSpike > 0.15) {
      await PromptVersionControl.rollbackToPreviousStable(agentId, canaryVersionId);
    } else {
      await PromptVersionControl.promoteToStable(agentId, canaryVersionId);
    }
  }

  private static async fetchRecentFailures(agentId: string): Promise<string[]> {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await (supabaseAdmin as any)
      .from("tasks")
      .select("metadata")
      .eq("assigned_agent_id", agentId)
      .order("updated_at", { ascending: false })
      .limit(5);
    return ((data as any[]) || [])
      .map((d) => d.metadata?.review_notes)
      .filter((n): n is string => typeof n === "string");
  }
}