import { osGenerate } from "../../os/llm";
import type { AgentPerformanceMetrics, PromptVersion } from "./LearningTypes";

export class PromptOptimizer {
  static async optimizePrompt(
    currentVersion: PromptVersion,
    metrics: AgentPerformanceMetrics,
    recentFailures: string[],
  ): Promise<{ newPrompt: string; newFewShots: string[]; reasoning: string }> {
    const failureContext =
      recentFailures.length > 0
        ? recentFailures.map((f, i) => `Failure ${i + 1}: ${f}`).join("\n")
        : "No specific recent failures. Focus on general efficiency and tone.";

    const prompt = `You are an Expert AI Prompt Engineer.
Rewrite the agent's system prompt to improve performance.

**Metrics (14d):**
- Success: ${(metrics.successRate * 100).toFixed(1)}%
- QA: ${metrics.averageQAScore.toFixed(2)}
- Human Override: ${(metrics.humanOverrideRate * 100).toFixed(1)}%
- Avg Reflection: ${metrics.averageReflectionIterations.toFixed(1)}

**Current Prompt:**
"""
${currentVersion.systemPrompt}
"""

**Recent Failures:**
${failureContext}

Output strict JSON:
{ "newPrompt":"string", "newFewShots":["string"], "reasoning":"string" }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      return JSON.parse(response.content);
    } catch (error) {
      console.error("[PromptOptimizer] Failed:", error);
      return {
        newPrompt: currentVersion.systemPrompt,
        newFewShots: currentVersion.fewShotExamples,
        reasoning: "Optimization failed; kept current prompt.",
      };
    }
  }
}