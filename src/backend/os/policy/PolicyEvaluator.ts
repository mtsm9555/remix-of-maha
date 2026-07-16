import type {
  PolicyRule,
  PolicyCondition,
  PolicyContext,
  PolicyEvaluationResult,
} from "./PolicyTypes";

export class PolicyEvaluator {
  static evaluate(context: PolicyContext, rules: PolicyRule[]): PolicyEvaluationResult {
    const sortedRules = [...rules]
      .filter((r) => r.isActive)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (rule.department && rule.department !== context.department) continue;
      if (this.evaluateRule(rule, context)) {
        return {
          action: rule.action,
          matchedRuleId: rule.id,
          matchedRuleName: rule.name,
          reason: rule.description,
        };
      }
    }

    if (context.estimatedCostUSD > 100) {
      return { action: "REQUIRE_APPROVAL", reason: "Default policy: High-cost action requires approval." };
    }
    return { action: "ALLOW", reason: "No matching policies. Default allow." };
  }

  private static evaluateRule(rule: PolicyRule, context: PolicyContext): boolean {
    if (!rule.conditions?.length) return true;
    const results = rule.conditions.map((c) => this.evaluateCondition(c, context));
    return rule.logic === "AND" ? results.every(Boolean) : results.some(Boolean);
  }

  private static evaluateCondition(condition: PolicyCondition, context: PolicyContext): boolean {
    const actualValue = this.resolveField(condition.field, context);
    const expectedValue = condition.value;
    switch (condition.operator) {
      case "eq":
        return actualValue === expectedValue;
      case "neq":
        return actualValue !== expectedValue;
      case "gt":
        return Number(actualValue) > Number(expectedValue);
      case "lt":
        return Number(actualValue) < Number(expectedValue);
      case "gte":
        return Number(actualValue) >= Number(expectedValue);
      case "lte":
        return Number(actualValue) <= Number(expectedValue);
      case "contains":
        return String(actualValue).includes(String(expectedValue));
      case "regex":
        return new RegExp(expectedValue).test(String(actualValue));
      case "in":
        return Array.isArray(expectedValue) && expectedValue.includes(actualValue);
      default:
        return false;
    }
  }

  private static resolveField(field: string, context: any): any {
    if (field === "context.time.hour") return new Date().getHours();
    if (field === "context.time.day") return new Date().getDay();
    return field.split(".").reduce((acc, part) => acc?.[part], context);
  }
}