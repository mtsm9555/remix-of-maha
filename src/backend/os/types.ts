import type { Department } from "../agents/departments/types";

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

export interface OSMilestone {
  id: string;
  department: Department;
  objective: string;
  successCriteria: string[];
  estimatedBudget: number;
  dependencies: string[];
}

export interface DepartmentState {
  id: Department;
  name: string;
  managerId: string;
  agents: string[];
  budget: DepartmentBudget;
  kpis: DepartmentKPI[];
}