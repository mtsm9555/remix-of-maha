import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const MARKETING_DEPARTMENT_ID: Department = "marketing";

export const MARKETING_KPIS: DepartmentKPI[] = [
  { name: "Monthly Leads Generated", target: 500, current: 0, unit: "leads" },
  { name: "Customer Acquisition Cost (CAC)", target: 45, current: 0, unit: "USD" },
  { name: "Content Engagement Rate", target: 5.5, current: 0, unit: "%" },
  { name: "SEO Domain Authority", target: 60, current: 0, unit: "score" },
];

export const MARKETING_BUDGET: DepartmentBudget = {
  allocated: 15000,
  spent: 0,
  limit: 20000,
};

export const MARKETING_AGENTS = [
  "marketing-content-agent",
  "marketing-seo-agent",
  "marketing-social-agent",
  "marketing-analytics-agent",
  "marketing-ads-agent",
];

export function initializeMarketingDepartment() {
  console.log("[Marketing] Initializing Marketing Department with OS Governance...");
  return {
    id: MARKETING_DEPARTMENT_ID,
    name: "Marketing",
    agents: MARKETING_AGENTS,
    budget: MARKETING_BUDGET,
    kpis: MARKETING_KPIS,
  };
}