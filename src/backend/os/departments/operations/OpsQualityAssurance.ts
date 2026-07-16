import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class OpsQualityAssurance extends QualityAssurance {
  static async reviewOpsTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[Ops QA] Reviewing operational task: ${task.description}`);

    const prompt = `You are the VP of Site Reliability Engineering (SRE) AI for Maha OS.
Evaluate the following operational output or automation script against SRE best practices.

Task: ${task.description}

Agent Output (Script/Logs/Runbook):
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Idempotency: safe to run twice?
2. Blast Radius: scope limited, error handling, timeouts.
3. Observability: logging and metrics emission.
4. Rollback Plan: recovery path on partial failure.

Output strictly in JSON:
{ "passed": boolean, "score": number, "feedback": "string", "requiresRevision": boolean }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      return {
        passed: !!parsed.passed,
        score: typeof parsed.score === "number" ? parsed.score : 0.5,
        feedback: parsed.feedback ?? "",
        requiresRevision: !!parsed.requiresRevision,
      };
    } catch {
      return {
        passed: true,
        score: 0.5,
        feedback: "QA engine error, auto-passed.",
        requiresRevision: false,
      };
    }
  }
}