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

  static canExecuteTask(
    id: Department,
    estimatedCost: number,
  ): { allowed: boolean; reason?: string } {
    const d = this.departments.get(id);
    if (!d) return { allowed: false, reason: "Department not initialized" };
    if (d.budget.spent + estimatedCost > d.budget.limit) {
      return { allowed: false, reason: `Budget limit ${d.budget.limit} exceeded` };
    }
    return { allowed: true };
  }

  static updateKPI(id: Department, name: string, current: number) {
    const d = this.departments.get(id);
    if (!d) return;
    const kpi = d.kpis.find((k) => k.name === name);
    if (kpi) kpi.current = current;
    else d.kpis.push({ name, target: current, current, unit: "count" });
  }
}