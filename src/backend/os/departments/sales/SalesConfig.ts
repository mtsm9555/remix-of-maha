import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const SALES_DEPARTMENT_ID: Department = "sales";

export const SALES_KPIS: DepartmentKPI[] = [
  { name: "Monthly Recurring Revenue (MRR)", target: 50000, current: 0, unit: "USD" },
  { name: "Lead Conversion Rate", target: 12.5, current: 0, unit: "%" },
  { name: "Average Deal Size", target: 5000, current: 0, unit: "USD" },
  { name: "Sales Cycle Length", target: 30, current: 0, unit: "days" },
];

export const SALES_BUDGET: DepartmentBudget = {
  allocated: 10000,
  spent: 0,
  limit: 15000,
};

export const SALES_AGENTS = [
  "sales-lead-agent",
  "sales-crm-agent",
  "sales-outreach-agent",
  "sales-proposal-agent",
];

export function initializeSalesDepartment() {
  console.log("[Sales] Initializing Sales Department with OS Governance...");
  return {
    id: SALES_DEPARTMENT_ID,
    name: "Sales",
    agents: SALES_AGENTS,
    budget: SALES_BUDGET,
    kpis: SALES_KPIS,
  };
}