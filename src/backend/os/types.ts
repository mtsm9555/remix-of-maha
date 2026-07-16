export interface DepartmentBudget {
  allocated: number;
  spent: number;
  limit: number;
}

export interface DepartmentKPI {
  name: string;
  target: number;
  current: number;
  unit: string;
}

export type { OSMilestone, OSPlan, PlanStatus, ExecutionWave, ResourceEstimate, RiskAssessment } from "./PlanTypes";

import type { Department } from "../agents/departments/types";
export interface DepartmentState {
  id: Department;
  name: string;
  managerId: string;
  agents: string[];
  budget: DepartmentBudget;
  kpis: DepartmentKPI[];
}