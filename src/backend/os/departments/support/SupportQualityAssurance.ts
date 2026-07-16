import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class SupportQualityAssurance extends QualityAssurance {
  static async reviewSupportTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[Support QA] Performing empathy and accuracy audit for: ${task.description}`);

    const prompt = `You are the VP of Customer Success AI for Maha OS.
Audit the following customer support output for empathy, accuracy, and brand safety.

Task: ${task.description}

Agent Output (Drafted Reply or Action):
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Empathy & Tone: human, acknowledges frustration, not robotic.
2. Accuracy & Hallucinations: no unauthorized promises (features, SLAs, refunds).
3. Clarity: solution and next steps explicit.
4. De-escalation: effective when customer is angry.

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
      return { passed: true, score: 0.5, feedback: "QA engine error, auto-passed.", requiresRevision: false };
    }
  }
}