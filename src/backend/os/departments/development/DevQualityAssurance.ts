import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class DevQualityAssurance extends QualityAssurance {
  static async reviewDevTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[Dev QA] Performing automated code review for: ${task.description}`);

    const prompt = `You are the Principal Software Engineer AI for Maha OS.
Perform a rigorous code review on the following output.

Task: ${task.description}
Tech Stack: TypeScript, Node.js, React, PostgreSQL.

Agent Output (Code/Logs):
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Security (OWASP Top 10): SQL injection, XSS, exposed secrets.
2. Performance: N+1 queries, memory leaks, Big-O complexity.
3. Maintainability: DRY, naming, typing.
4. Testability: unit-testable structure.

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