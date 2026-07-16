import { osGenerate } from "../../os/llm";
import type { DepartmentTask } from "../../os/TaskBoard";
import type { ReflectionMetrics, ReflectionResult } from "./SelfReflectionTypes";

export class SelfReflectionEngine {
  private static MAX_REFLECTION_ITERATIONS = 2;
  private static metrics: Map<string, ReflectionMetrics> = new Map();

  static async reflectAndRefine(
    task: DepartmentTask,
    rawOutput: unknown,
    agentId: string,
  ): Promise<ReflectionResult> {
    console.log(`[SelfReflection] Agent ${agentId} reflecting on task ${task.id}`);

    let currentOutput: unknown = rawOutput;
    let iterations = 0;
    let needsRevision = true;
    let critique = "";

    while (needsRevision && iterations < this.MAX_REFLECTION_ITERATIONS) {
      iterations++;
      const reflection = await this.critiqueOutput(task, currentOutput);
      critique = reflection.critique;
      if (!reflection.needsRevision) {
        needsRevision = false;
        break;
      }
      console.log(`[SelfReflection] Iteration ${iterations}: refining...`);
      currentOutput = await this.refineOutput(task, currentOutput, reflection.critique);
    }

    this.updateMetrics(agentId, iterations, needsRevision);

    return {
      needsRevision,
      critique,
      refinedOutput: currentOutput,
      confidenceScore: needsRevision ? 0.5 : 0.9,
      iterationsUsed: iterations,
    };
  }

  private static async critiqueOutput(
    task: DepartmentTask,
    output: unknown,
  ): Promise<{ needsRevision: boolean; critique: string }> {
    const prompt = `You are an expert AI agent reflecting on your own work.

**Original Task:**
${task.description}

**Success Criteria:**
- ${task.successCriteria.join("\n- ")}

**Your Raw Output:**
${JSON.stringify(output, null, 2)}

**Instructions:**
1. Check if your output strictly meets ALL success criteria.
2. Look for hallucinations, logical gaps, or formatting errors.
3. Be harsh. If it's not perfect, it needs revision.

**Output strictly in JSON format:**
{ "needsRevision": boolean, "critique": "string" }`;

    const response = await osGenerate(prompt, { responseFormat: "json" });
    try {
      const parsed = JSON.parse(response.content);
      return {
        needsRevision: Boolean(parsed.needsRevision),
        critique: String(parsed.critique ?? ""),
      };
    } catch {
      return { needsRevision: false, critique: "Unparseable critique; accepting output." };
    }
  }

  private static async refineOutput(
    task: DepartmentTask,
    currentOutput: unknown,
    critique: string,
  ): Promise<unknown> {
    const prompt = `You are an expert AI agent correcting your own work.

**Original Task:**
${task.description}

**Your Previous Output:**
${JSON.stringify(currentOutput, null, 2)}

**Your Self-Critique:**
"${critique}"

Rewrite the output to perfectly address the critique and meet all success criteria.
Return ONLY the corrected output in the same format as before.`;

    const response = await osGenerate(prompt);
    try {
      return JSON.parse(response.content);
    } catch {
      return response.content;
    }
  }

  private static updateMetrics(agentId: string, iterationsUsed: number, failedSelfReflection: boolean) {
    const metrics = this.metrics.get(agentId) ?? {
      agentId,
      totalReflections: 0,
      selfCorrectionsMade: 0,
      qaRejectionsAfterReflection: 0,
      averageIterations: 0,
      tokenSavingsEstimate: 0,
    };

    metrics.totalReflections++;
    if (iterationsUsed > 1) metrics.selfCorrectionsMade++;
    if (failedSelfReflection) metrics.qaRejectionsAfterReflection++;
    metrics.averageIterations =
      (metrics.averageIterations * (metrics.totalReflections - 1) + iterationsUsed) /
      metrics.totalReflections;
    if (iterationsUsed > 1) metrics.tokenSavingsEstimate += 1000;

    this.metrics.set(agentId, metrics);
  }

  static getMetrics(agentId?: string | null): ReflectionMetrics | ReflectionMetrics[] | undefined {
    if (agentId) return this.metrics.get(agentId);
    return Array.from(this.metrics.values());
  }

  static resetMetrics() {
    this.metrics.clear();
  }
}
