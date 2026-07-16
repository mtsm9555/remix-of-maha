import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const SUPPORT_DEPARTMENT_ID: Department = "support";

export const SUPPORT_KPIS: DepartmentKPI[] = [
  { name: "First Response Time (FRT)", target: 60, current: 0, unit: "minutes" },
  { name: "Customer Satisfaction (CSAT)", target: 4.5, current: 0, unit: "score (1-5)" },
  { name: "Ticket Resolution Time", target: 24, current: 0, unit: "hours" },
  { name: "Ticket Deflection Rate", target: 30, current: 0, unit: "%" },
];

export const SUPPORT_BUDGET: DepartmentBudget = {
  allocated: 4000,
  spent: 0,
  limit: 5000,
};

export const SUPPORT_AGENTS = [
  "support-triage-agent",
  "support-resolution-agent",
  "support-knowledge-agent",
  "support-escalation-agent",
];

export function initializeSupportDepartment() {
  console.log("[Support] Initializing Customer Support Department with OS Governance...");
  return {
    id: SUPPORT_DEPARTMENT_ID,
    name: "Customer Support",
    agents: SUPPORT_AGENTS,
    budget: SUPPORT_BUDGET,
    kpis: SUPPORT_KPIS,
  };
}