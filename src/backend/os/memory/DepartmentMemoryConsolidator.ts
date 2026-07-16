import { osGenerate } from "../llm";
import { DepartmentMemoryEngine } from "./DepartmentMemoryEngine";
import type { Department } from "../../agents/departments/types";
import type { DepartmentTask } from "../TaskBoard";

export class DepartmentMemoryConsolidator {
  static async consolidateMilestone(
    departmentId: Department,
    milestoneId: string,
    completedTasks: DepartmentTask[],
  ) {
    console.log(
      `[DeptConsolidator] Consolidating memory for ${departmentId} milestone ${milestoneId}`,
    );
    const successfulTasks = completedTasks.filter(
      (t) => t.status === "completed" && t.reviewNotes && !t.reviewNotes.includes("failed"),
    );
    if (successfulTasks.length === 0) return;

    await this.extractProceduralMemory(departmentId, milestoneId, successfulTasks);
    await this.extractSemanticMemory(departmentId, milestoneId, successfulTasks);
  }

  private static async extractProceduralMemory(
    deptId: Department,
    milestoneId: string,
    tasks: DepartmentTask[],
  ) {
    const taskSummaries = tasks
      .map((t) => `- ${t.description} | Result: ${t.reviewNotes}`)
      .join("\n");
    const prompt = `You are the Knowledge Extraction Engine for the ${deptId} department.
Analyze the following completed tasks and extract 1-3 actionable "Procedural Memories" (lessons learned, best practices, or standard operating procedures).

Completed Tasks:
${taskSummaries}

Output strictly in JSON:
{ "memories": [{ "content": "string", "importanceScore": 0.0 }] }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      for (const mem of parsed.memories ?? []) {
        await DepartmentMemoryEngine.storeMemory({
          departmentId: deptId,
          type: "procedural",
          content: mem.content,
          embedding: [],
          importanceScore: mem.importanceScore ?? 0.6,
          metadata: { milestoneId, successScore: 0.9 },
        });
      }
    } catch (error) {
      console.error("[DeptConsolidator] Procedural extraction failed:", error);
    }
  }

  private static async extractSemanticMemory(
    deptId: Department,
    milestoneId: string,
    tasks: DepartmentTask[],
  ) {
    const taskOutputs = tasks
      .map((t) => {
        try {
          return JSON.stringify(t.output);
        } catch {
          return String(t.output);
        }
      })
      .join("\n");
    const prompt = `You are the Knowledge Extraction Engine for the ${deptId} department.
Analyze the following task outputs and extract 1-3 "Semantic Memories" (facts, data points, or domain knowledge).

Task Outputs:
${taskOutputs.substring(0, 2000)}

Output strictly in JSON:
{ "memories": [{ "content": "string", "importanceScore": 0.0 }] }`;

    try {
      const response = await osGenerate(prompt, { responseFormat: "json" });
      const parsed = JSON.parse(response.content);
      for (const mem of parsed.memories ?? []) {
        await DepartmentMemoryEngine.storeMemory({
          departmentId: deptId,
          type: "semantic",
          content: mem.content,
          embedding: [],
          importanceScore: mem.importanceScore ?? 0.6,
          metadata: { milestoneId },
        });
      }
    } catch (error) {
      console.error("[DeptConsolidator] Semantic extraction failed:", error);
    }
  }
}

export * from "./DepartmentMemoryTypes";