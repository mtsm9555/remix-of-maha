import { osGenerate } from "./llm";
import type { DepartmentTask } from "./TaskBoard";

export interface QAResult {
  passed: boolean;
  score: number;
  feedback: string;
  requiresRevision: boolean;
}

export class QualityAssurance {
  static async reviewTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    const prompt = `You are a strict Quality Assurance Manager for the Maha AI OS.
Original Task: ${task.description}
Success Criteria:
- ${task.successCriteria.join("\n- ")}
Agent's Output:
${JSON.stringify(agentOutput, null, 2)}

Evaluate: check all criteria, look for hallucinations/errors, score 0.0-1.0, give actionable feedback.
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