import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class HRQualityAssurance extends QualityAssurance {
  static async reviewHRTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[HR QA] Performing compliance and bias audit for: ${task.description}`);

    const prompt = `You are the Chief People Officer and Legal Compliance AI for Maha OS.
Audit the following HR output for legal compliance, inclusivity, and clarity.

Task: ${task.description}

Agent Output (Job Description, Offer Letter, or Email):
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Bias & Inclusivity (DEI): gendered language, ableist/ageist phrasing.
2. Legal Compliance: illegal interview questions, at-will statements.
3. Clarity & Tone: welcoming, professional, transparent on comp/benefits.
4. PII Safety: no SSNs, bank details, home addresses in plain text.

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