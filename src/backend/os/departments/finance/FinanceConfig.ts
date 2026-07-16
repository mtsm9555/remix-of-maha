import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const FINANCE_DEPARTMENT_ID: Department = "finance";

export const FINANCE_KPIS: DepartmentKPI[] = [
  { name: "Days Sales Outstanding (DSO)", target: 30, current: 0, unit: "days" },
  { name: "Month-End Close Time", target: 3, current: 0, unit: "days" },
  { name: "Expense Report Processing Time", target: 24, current: 0, unit: "hours" },
  { name: "Invoice Error Rate", target: 0.5, current: 0, unit: "%" },
];

export const FINANCE_BUDGET: DepartmentBudget = {
  allocated: 5000,
  spent: 0,
  limit: 7500,
};

export const FINANCE_AGENTS = [
  "finance-invoice-agent",
  "finance-accounting-agent",
  "finance-reporting-agent",
  "finance-compliance-agent",
];

export function initializeFinanceDepartment() {
  console.log("[Finance] Initializing Finance Department with OS Governance...");
  return {
    id: FINANCE_DEPARTMENT_ID,
    name: "Finance",
    agents: FINANCE_AGENTS,
    budget: FINANCE_BUDGET,
    kpis: FINANCE_KPIS,
  };
}