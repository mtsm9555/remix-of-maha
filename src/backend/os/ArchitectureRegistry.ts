import type { Department, DepartmentAgent } from "../agents/departments/types";
import { DepartmentManagerAgent } from "./DepartmentManagerAgent";
import { InterDepartmentBus, type InterDeptRequest } from "./InterDepartmentBus";
import { DepartmentManager } from "./DepartmentManager";
import type { DepartmentBudget, DepartmentKPI, OSMilestone } from "./types";

export interface DepartmentInit {
  id: Department;
  name: string;
  agents: DepartmentAgent[];
  budget: DepartmentBudget;
  kpis: DepartmentKPI[];
}

export class ArchitectureRegistry {
  private static managers: Map<Department, DepartmentManagerAgent> = new Map();

  static initializeOrganization(departments: DepartmentInit[]) {
    console.log("[Architecture] Initializing Enterprise Organization...");

    for (const dept of departments) {
      DepartmentManager.initializeDepartment({
        id: dept.id,
        name: dept.name,
        managerId: `${dept.id}_manager`,
        agents: dept.agents.map((a) => a.id),
        budget: dept.budget,
        kpis: dept.kpis,
      });

      const manager = new DepartmentManagerAgent(dept.id, dept.agents);
      this.managers.set(dept.id, manager);

      InterDepartmentBus.registerHandler(dept.id, async (req: InterDeptRequest) => {
        const mockMilestone: OSMilestone = {
          id: req.id,
          department: dept.id,
          objective: req.payload?.objective || req.requestType,
          successCriteria: [],
          estimatedBudget: 0,
          dependencies: [],
        };
        return await manager.executeMilestone(mockMilestone);
      });

      console.log(
        `[Architecture] ✅ ${dept.name} initialized with Manager and ${dept.agents.length} agents.`,
      );
    }
  }

  static async executeMilestoneInDepartment(departmentId: Department, milestone: OSMilestone) {
    const manager = this.managers.get(departmentId);
    if (!manager) throw new Error(`Department ${departmentId} not initialized`);
    return await manager.executeMilestone(milestone);
  }

  static async requestInterDepartmentHelp(
    from: Department,
    to: Department,
    requestType: string,
    payload: any,
    slaMinutes: number = 30,
  ) {
    return await InterDepartmentBus.sendRequest({
      fromDepartment: from,
      toDepartment: to,
      requestType,
      payload,
      priority: "normal",
      slaMinutes,
    });
  }

  static getOrgHealthReport() {
    const departments = DepartmentManager.getAllDepartments();
    const slaViolations = InterDepartmentBus.getSLAViolations();
    return {
      departments: departments.map((d) => ({
        ...d,
        managerMetrics: this.managers.get(d.id)?.getPoolMetrics(),
      })),
      slaViolations: slaViolations.length,
      totalPendingInterDeptRequests: 0,
    };
  }

  static getManager(id: Department) {
    return this.managers.get(id);
  }
}