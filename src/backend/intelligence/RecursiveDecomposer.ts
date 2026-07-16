import type { OSMilestone } from "../os/PlanTypes";
import { osGenerate } from "../os/llm";
import type { Department } from "../agents/departments/types";

export class RecursiveDecomposer {
  static async breakDownMilestone(parent: OSMilestone): Promise<OSMilestone[]> {
    console.log(`[RecursiveDecomposer] Breaking down complex milestone: "${parent.objective}"`);

    const prompt = `You are the Recursive Task Breakdown Engine.
The following milestone is too complex for the current agents to execute in one go.

Parent Milestone: "${parent.objective}"
Department: ${parent.department}
Success Criteria: ${parent.successCriteria.join(", ")}

Break this down into 3-5 smaller, highly specific, sequential sub-milestones.
Each sub-milestone must be simple enough to be executed by a single agent instance.

Output strictly in JSON:
{ "subMilestones": [ { "objective": "string", "successCriteria": ["string"] } ] }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      const subs: Array<{ objective: string; successCriteria: string[] }> =
        parsed.subMilestones ?? [];
      if (subs.length === 0) return [parent];

      return subs.map((sub, index) => ({
        id: `${parent.id}_sub_${index + 1}`,
        wave: parent.wave,
        department: parent.department as Department,
        objective: sub.objective,
        successCriteria: sub.successCriteria,
        dependencies:
          index === 0 ? parent.dependencies : [`${parent.id}_sub_${index}`],
        resources: {
          apiCostUSD: parent.resources.apiCostUSD / subs.length,
          estimatedAgentHours: parent.resources.estimatedAgentHours / subs.length,
          estimatedWallClockMinutes: parent.resources.estimatedWallClockMinutes / subs.length,
          tokenUsageEstimate: parent.resources.tokenUsageEstimate / subs.length,
        },
        risks: [],
        status: "pending" as const,
      }));
    } catch (error) {
      console.error("[RecursiveDecomposer] Breakdown failed, returning original milestone:", error);
      return [parent];
    }
  }
}