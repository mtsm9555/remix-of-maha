import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const DEV_DEPARTMENT_ID: Department = "development";

export const DEV_KPIS: DepartmentKPI[] = [
  { name: "Deployment Frequency", target: 5, current: 0, unit: "deploys/day" },
  { name: "Lead Time for Changes", target: 2, current: 0, unit: "hours" },
  { name: "Change Failure Rate", target: 2, current: 0, unit: "%" },
  { name: "Test Coverage", target: 85, current: 0, unit: "%" },
];

export const DEV_BUDGET: DepartmentBudget = {
  allocated: 25000,
  spent: 0,
  limit: 30000,
};

export const DEV_AGENTS = [
  "dev-code-agent",
  "dev-debug-agent",
  "dev-devops-agent",
  "dev-security-agent",
];

export function initializeDevelopmentDepartment() {
  console.log("[Development] Initializing Development Department with OS Governance...");
  return {
    id: DEV_DEPARTMENT_ID,
    name: "Development",
    agents: DEV_AGENTS,
    budget: DEV_BUDGET,
    kpis: DEV_KPIS,
  };
}