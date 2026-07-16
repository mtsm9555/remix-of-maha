import type { OSPlan } from "./PlanTypes";
import { DepartmentManager } from "./DepartmentManager";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class PlanValidator {
  static async validate(plan: OSPlan, _userId: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const deptCosts = new Map<string, number>();
    for (const milestone of plan.milestones) {
      const current = deptCosts.get(milestone.department) || 0;
      deptCosts.set(milestone.department, current + milestone.resources.apiCostUSD);
    }

    for (const [deptId, cost] of deptCosts.entries()) {
      const dept = DepartmentManager.getDepartment(deptId as any);
      if (dept && dept.budget.spent + cost > dept.budget.limit) {
        errors.push(
          `Department ${deptId} will exceed its budget limit. Required: $${cost}, Remaining: $${dept.budget.limit - dept.budget.spent}`,
        );
      } else if (dept && dept.budget.spent + cost > dept.budget.limit * 0.8) {
        warnings.push(`Department ${deptId} will use over 80% of its remaining budget.`);
      }
    }

    const highRiskActions = plan.milestones.filter((m) =>
      m.risks.some((r) => r.level === "critical" || r.level === "high"),
    );
    if (highRiskActions.length > 0) {
      warnings.push(
        `Plan contains ${highRiskActions.length} high/critical risk milestones. Human approval will be required.`,
      );
    }

    const depErrors = this.checkCircularDependencies(plan.milestones);
    errors.push(...depErrors);

    return { isValid: errors.length === 0, errors, warnings };
  }

  private static checkCircularDependencies(
    milestones: { id: string; dependencies: string[] }[],
  ): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (id: string): boolean => {
      if (recursionStack.has(id)) return true;
      if (visited.has(id)) return false;
      visited.add(id);
      recursionStack.add(id);
      const milestone = milestones.find((m) => m.id === id);
      if (milestone) {
        for (const dep of milestone.dependencies) {
          if (dfs(dep)) return true;
        }
      }
      recursionStack.delete(id);
      return false;
    };

    for (const m of milestones) {
      if (dfs(m.id)) errors.push(`Circular dependency detected involving milestone: ${m.id}`);
    }
    return errors;
  }
}