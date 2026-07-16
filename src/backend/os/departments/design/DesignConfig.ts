import type { DepartmentBudget, DepartmentKPI } from "../../DepartmentManager";
import type { Department } from "../../../agents/departments/types";

export const DESIGN_DEPARTMENT_ID: Department = "design";

export const DESIGN_KPIS: DepartmentKPI[] = [
  { name: "Average Asset Delivery Time", target: 24, current: 0, unit: "hours" },
  { name: "Brand Consistency Score", target: 95, current: 0, unit: "%" },
  { name: "WCAG Accessibility Compliance", target: 100, current: 0, unit: "%" },
  { name: "Design System Component Reuse", target: 80, current: 0, unit: "%" },
];

export const DESIGN_BUDGET: DepartmentBudget = {
  allocated: 12000,
  spent: 0,
  limit: 15000,
};

export const DESIGN_AGENTS = [
  "design-ui-agent",
  "design-ux-agent",
  "design-graphic-agent",
  "design-video-agent",
];

export function initializeDesignDepartment() {
  console.log("[Design] Initializing Design Department with OS Governance...");
  return {
    id: DESIGN_DEPARTMENT_ID,
    name: "Design",
    agents: DESIGN_AGENTS,
    budget: DESIGN_BUDGET,
    kpis: DESIGN_KPIS,
  };
}