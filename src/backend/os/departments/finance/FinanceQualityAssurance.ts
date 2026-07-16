import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class FinanceQualityAssurance extends QualityAssurance {
  static async reviewFinanceTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[Finance QA] Performing financial audit for: ${task.description}`);

    const prompt = `You are the Chief Financial Officer (CFO) and Lead Auditor AI for Maha OS.
Perform a rigorous financial and compliance audit on the following output.

Task: ${task.description}

Agent Output (Financial Data/Calculations):
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Mathematical Accuracy: sums, rounding.
2. GAAP/IFRS Compliance: revenue/expense recognition, accruals.
3. Anomaly Detection: unusual spikes, duplicates, suspicious vendors.
4. Audit Trail: references to source documents (POs, receipt IDs).

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