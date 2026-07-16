import type { AdvancedOSPlan, FeasibilityReview } from "./AdvancedPlanTypes";
import type { OSMilestone } from "../os/PlanTypes";
import { osGenerate } from "../os/llm";

export class PlanFeasibilityChecker {
  static async reviewPlan(plan: AdvancedOSPlan): Promise<FeasibilityReview[]> {
    console.log("[FeasibilityChecker] Requesting feasibility reviews from Department Managers...");
    const reviews: FeasibilityReview[] = [];

    const byDept = new Map<string, OSMilestone[]>();
    for (const m of plan.milestones) {
      if (!byDept.has(m.department)) byDept.set(m.department, []);
      byDept.get(m.department)!.push(m);
    }

    for (const [deptId, milestones] of byDept.entries()) {
      const review = await this.requestDepartmentReview(deptId, milestones);
      reviews.push(...review);
    }
    return reviews;
  }

  private static async requestDepartmentReview(
    deptId: string,
    milestones: OSMilestone[],
  ): Promise<FeasibilityReview[]> {
    const prompt = `You are the Manager of the ${deptId} department.
Review the following milestones assigned to your team.

Milestones:
${JSON.stringify(
  milestones.map((m) => ({
    id: m.id,
    objective: m.objective,
    timeEstimate: m.resources.estimatedWallClockMinutes,
  })),
  null,
  2,
)}

For each milestone, provide a confidence score (0.0 to 1.0) on whether your team can achieve it within the estimated time and resources.
If confidence is below 0.7, provide specific feedback on what needs to change.

Output strictly in JSON:
{ "reviews": [ { "milestoneId": "string", "confidenceScore": number, "feedback": "string" } ] }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      return (parsed.reviews ?? []).map((r: any) => ({
        milestoneId: r.milestoneId,
        departmentManagerId: `${deptId}_manager`,
        confidenceScore: typeof r.confidenceScore === "number" ? r.confidenceScore : 0.5,
        feedback: r.feedback ?? "",
      }));
    } catch (error) {
      console.error(`[FeasibilityChecker] Failed to get review from ${deptId}:`, error);
      return milestones.map((m) => ({
        milestoneId: m.id,
        departmentManagerId: `${deptId}_manager`,
        confidenceScore: 0.5,
        feedback: "Review failed, defaulting to medium confidence.",
      }));
    }
  }
}