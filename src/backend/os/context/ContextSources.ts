import type { ContextChunk, ContextRequest } from "./ContextTypes";
import { ArchitectureRegistry } from "../ArchitectureRegistry";
import { DepartmentManager } from "../DepartmentManager";
import type { Department } from "../../agents/departments/types";

export class ContextSources {
  static async getOSState(request: ContextRequest): Promise<ContextChunk[]> {
    if (!request.activePlanId) return [];

    const orgHealth = ArchitectureRegistry.getOrgHealthReport();
    const content = `
<OS_STATE>
Active Plan: ${request.activePlanId}
Session: ${request.sessionId}
</OS_STATE>

<ORGANIZATION_HEALTH>
Departments Active: ${orgHealth.departments.length}
SLA Violations: ${orgHealth.slaViolations}
Pending Inter-Dept Requests: ${orgHealth.totalPendingInterDeptRequests}
</ORGANIZATION_HEALTH>
    `.trim();

    return [
      {
        id: "os_state",
        source: "os_state",
        content,
        relevanceScore: 0.95,
        tokenEstimate: Math.ceil(content.length / 4),
        metadata: { planId: request.activePlanId },
      },
    ];
  }

  static async getDepartmentContext(request: ContextRequest): Promise<ContextChunk[]> {
    if (!request.actorDepartment) return [];
    const dept = DepartmentManager.getDepartment(request.actorDepartment as Department);
    if (!dept) return [];

    const content = `
<DEPARTMENT_CONTEXT: ${dept.name.toUpperCase()}>
Manager: ${dept.managerId}
Budget: $${dept.budget.spent} spent of $${dept.budget.limit} limit
KPIs: ${dept.kpis.map((k) => `${k.name} (${k.current}/${k.target} ${k.unit})`).join(", ")}
</DEPARTMENT_CONTEXT>
    `.trim();

    return [
      {
        id: `dept_${dept.id}`,
        source: "department",
        content,
        relevanceScore: 0.9,
        tokenEstimate: Math.ceil(content.length / 4),
      },
    ];
  }

  static async getMemoryContext(request: ContextRequest): Promise<ContextChunk[]> {
    console.log(
      `[Context] Fetching memory for: "${request.currentTask.substring(0, 30)}..."`,
    );
    return [
      {
        id: "mem_001",
        source: "memory",
        content:
          "User prefers concise, executive-style summaries. Previous project 'Alpha' failed due to budget overruns.",
        relevanceScore: 0.85,
        tokenEstimate: 25,
      },
    ];
  }

  static async getGraphContext(_request: ContextRequest): Promise<ContextChunk[]> {
    return [
      {
        id: "graph_001",
        source: "knowledge_graph",
        content: "Entity: 'Maha OS' -> Relation: 'HAS_DEPARTMENT' -> Entity: 'Marketing'",
        relevanceScore: 0.7,
        tokenEstimate: 15,
      },
    ];
  }
}