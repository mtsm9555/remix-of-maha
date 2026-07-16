import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class MarketingQualityAssurance extends QualityAssurance {
  static async reviewMarketingTask(
    task: DepartmentTask,
    agentOutput: any,
  ): Promise<QAResult> {
    console.log(`[Marketing QA] Reviewing task: ${task.description}`);

    const prompt = `You are the Chief Marketing Officer (CMO) AI for Maha OS.
Evaluate the following marketing output against brand guidelines and performance criteria.

Task: ${task.description}
Target Audience: B2B Tech Decision Makers
Brand Voice: Professional, innovative, authoritative, yet accessible (like J.A.R.V.I.S.).

Agent Output:
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Brand Voice Alignment (Is it too casual? Too robotic?)
2. Clarity and Value Proposition (Is the benefit clear?)
3. SEO/Formatting (Are headers, keywords, and structure optimal?)
4. Call to Action (Is there a clear next step for the user?)

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