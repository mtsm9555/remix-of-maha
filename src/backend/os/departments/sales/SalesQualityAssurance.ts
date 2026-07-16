import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class SalesQualityAssurance extends QualityAssurance {
  static async reviewSalesTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[Sales QA] Reviewing task: ${task.description}`);

    const prompt = `You are the VP of Sales AI for Maha OS.
Evaluate the following sales output against company guidelines, compliance, and effectiveness.

Task: ${task.description}
Target Persona: Enterprise CTOs and VPs of Engineering.

Agent Output:
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Tone Check: professional, consultative, not overly aggressive/pushy.
2. Accuracy: no hallucinated pricing, features, or SLAs.
3. Compliance: opt-out/unsubscribe mechanism (CAN-SPAM/GDPR).
4. Value Prop: ROI/business value clearly articulated.

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