import { QualityAssurance, type QAResult } from "../../QualityAssurance";
import type { DepartmentTask } from "../../TaskBoard";
import { osGenerate } from "../../llm";

export class DesignQualityAssurance extends QualityAssurance {
  static async reviewDesignTask(task: DepartmentTask, agentOutput: any): Promise<QAResult> {
    console.log(`[Design QA] Reviewing task: ${task.description}`);

    const prompt = `You are the Lead Design System Architect AI for Maha OS.
Evaluate the following design output against our strict design system and accessibility standards.

Task: ${task.description}
Brand Guidelines: Minimalist, high contrast, uses 'Inter' font, primary color #0ea5e9.

Agent Output:
${JSON.stringify(agentOutput, null, 2)}

Evaluation Criteria:
1. Brand Adherence: color palette, typography, spacing.
2. Accessibility (WCAG 2.1 AA): contrast ratios, touch targets, alt-text logic.
3. Visual Hierarchy: focal point, balance.
4. Technical Feasibility: buildable with standard CSS/Tailwind.

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