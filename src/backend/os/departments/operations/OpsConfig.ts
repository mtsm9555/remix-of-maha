import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const OPS_DEPARTMENT_ID: Department = "operations";

export const OPS_KPIS: DepartmentKPI[] = [
  { name: "System Uptime", target: 99.9, current: 0, unit: "%" },
  { name: "Automation Success Rate", target: 95, current: 0, unit: "%" },
  { name: "Mean Time to Resolve (MTTR)", target: 15, current: 0, unit: "minutes" },
  { name: "Manual Tasks Automated", target: 50, current: 0, unit: "tasks/month" },
];

export const OPS_BUDGET: DepartmentBudget = {
  allocated: 8000,
  spent: 0,
  limit: 10000,
};

export const OPS_AGENTS = [
  "ops-workflow-agent",
  "ops-automation-agent",
  "ops-monitoring-agent",
  "ops-vendor-agent",
];

export function initializeOperationsDepartment() {
  console.log("[Operations] Initializing Operations Department with OS Governance...");
  return {
    id: OPS_DEPARTMENT_ID,
    name: "Operations",
    agents: OPS_AGENTS,
    budget: OPS_BUDGET,
    kpis: OPS_KPIS,
  };
}