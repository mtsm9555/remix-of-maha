import type { Department } from "../agents/departments/types";
import type { DepartmentState } from "./types";

export type { DepartmentBudget, DepartmentKPI } from "./types";

export class DepartmentManager {
  private static departments: Map<Department, DepartmentState> = new Map();

  static initializeDepartment(state: DepartmentState) {
    this.departments.set(state.id, state);
  }

  static getDepartment(id: Department): DepartmentState | undefined {
    return this.departments.get(id);
  }

  static getAllDepartments(): DepartmentState[] {
    return Array.from(this.departments.values());
  }

  static recordSpend(id: Department, amount: number) {
    const d = this.departments.get(id);
    if (d) d.budget.spent += amount;
  }
}