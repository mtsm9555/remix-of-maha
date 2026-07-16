import { createServerFn } from "@tanstack/react-start";

export interface DeptSnapshot {
  id: string;
  name: string;
  managerId: string;
  agents: string[];
  budget: { allocated: number; spent: number; limit: number };
  kpis: Array<{ name: string; target: number; current: number; unit: string }>;
  tools: Array<{ name: string; level: string; description: string; rateLimit?: number }>;
  workflows: Array<{ id: string; name: string; description: string; steps: number }>;
  memory: { note: string };
}

export const getDepartmentsSnapshot = createServerFn({ method: "GET" }).handler(
  async (): Promise<DeptSnapshot[]> => {
    const { initializeMahaOS } = await import("@/backend/os/bootstrap");
    await initializeMahaOS();
    const { DepartmentManager } = await import("@/backend/os/DepartmentManager");
    const { DepartmentToolPermissions } = await import(
      "@/backend/os/permissions/DepartmentToolPermissions"
    );
    const { MARKETING_WORKFLOWS } = await import(
      "@/backend/os/departments/marketing/MarketingWorkflows"
    );
    const { SALES_WORKFLOWS } = await import("@/backend/os/departments/sales/SalesWorkflows");
    const { DESIGN_WORKFLOWS } = await import("@/backend/os/departments/design/DesignWorkflows");
    const { DEV_WORKFLOWS } = await import(
      "@/backend/os/departments/development/DevWorkflows"
    );
    const { OPS_WORKFLOWS } = await import("@/backend/os/departments/operations/OpsWorkflows");
    const { FINANCE_WORKFLOWS } = await import(
      "@/backend/os/departments/finance/FinanceWorkflows"
    );
    const { HR_WORKFLOWS } = await import("@/backend/os/departments/hr/HRWorkflows");
    const { SUPPORT_WORKFLOWS } = await import(
      "@/backend/os/departments/support/SupportWorkflows"
    );

    const workflowsByDept: Record<string, any[]> = {
      marketing: MARKETING_WORKFLOWS,
      sales: SALES_WORKFLOWS,
      design: DESIGN_WORKFLOWS,
      development: DEV_WORKFLOWS,
      operations: OPS_WORKFLOWS,
      finance: FINANCE_WORKFLOWS,
      hr: HR_WORKFLOWS,
      support: SUPPORT_WORKFLOWS,
      research: [],
    };

    const rules = DepartmentToolPermissions.getAllRules();
    const departments = DepartmentManager.getAllDepartments();

    return departments.map((d) => {
      const tools = rules
        .filter(
          (r) =>
            r.allowedDepartments === "ALL" ||
            (Array.isArray(r.allowedDepartments) && r.allowedDepartments.includes(d.id)),
        )
        .map((r) => ({
          name: r.toolName,
          level: r.level,
          description: r.description,
          rateLimit: r.maxExecutionsPerHour,
        }));

      const wfs = workflowsByDept[d.id] ?? [];
      return {
        id: d.id,
        name: d.name,
        managerId: d.managerId,
        agents: d.agents,
        budget: d.budget,
        kpis: d.kpis,
        tools,
        workflows: wfs.map((w) => ({
          id: w.id,
          name: w.name,
          description: w.description,
          steps: Array.isArray(w.nodes) ? w.nodes.length : 0,
        })),
        memory: {
          note: "Procedural + semantic memory consolidated per milestone via DepartmentMemoryConsolidator.",
        },
      };
    });
  },
);