import type {
  ParameterConstraint,
  ToolAccessDecision,
  ToolAccessRequest,
  ToolPermissionRule,
} from "./ToolPermissionTypes";

export class DepartmentToolPermissions {
  private static rules: Map<string, ToolPermissionRule> = new Map();
  private static executionCounts: Map<string, { count: number; resetAt: number }> = new Map();
  private static initialized = false;

  static initializeDefaultRules() {
    if (this.initialized) return;
    this.initialized = true;

    this.addRule({
      id: "dev_deploy",
      toolName: "deploy_to_production",
      allowedDepartments: ["development", "operations"],
      level: "require_approval",
      description: "Deploying to production requires human approval.",
    });

    this.addRule({
      id: "dev_code_exec",
      toolName: "execute_terminal_command",
      allowedDepartments: ["development", "operations"],
      level: "allow",
      parameterConstraints: [
        { field: "command", operator: "not_equals", value: "rm -rf /" },
        { field: "command", operator: "not_equals", value: "sudo reboot" },
      ],
      description: "Terminal access restricted to Dev/Ops. Dangerous commands blocked.",
    });

    this.addRule({
      id: "mkt_email",
      toolName: "send_bulk_email",
      allowedDepartments: ["marketing", "sales"],
      level: "allow",
      parameterConstraints: [
        { field: "recipient_domain", operator: "regex", value: "^.*@(?!company\\.com).*$" },
      ],
      maxExecutionsPerHour: 5,
      description: "Marketing can send external emails, max 5 batches/hour.",
    });

    this.addRule({
      id: "fin_transfer",
      toolName: "initiate_bank_transfer",
      allowedDepartments: ["finance"],
      level: "require_approval",
      parameterConstraints: [{ field: "amount", operator: "max_value", value: 10000 }],
      description: "Transfers over $10k require human approval.",
    });

    this.addRule({
      id: "global_deny_db",
      toolName: "drop_database_table",
      allowedDepartments: [],
      level: "deny",
      description: "Dropping database tables is strictly forbidden for all AI agents.",
    });

    console.log("[Permissions] Default Tool Permission Rules initialized.");
  }

  static addRule(rule: ToolPermissionRule) {
    DepartmentToolPermissions.rules.set(rule.id, rule);
  }

  static removeRule(id: string) {
    DepartmentToolPermissions.rules.delete(id);
  }

  static getAllRules(): ToolPermissionRule[] {
    return Array.from(this.rules.values());
  }

  static evaluateAccess(request: ToolAccessRequest): ToolAccessDecision {
    const applicableRules = Array.from(this.rules.values()).filter(
      (rule) => rule.toolName === request.toolName,
    );

    if (applicableRules.length === 0) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `No permission rule defined for tool: ${request.toolName}. Access denied by default.`,
      };
    }

    for (const rule of applicableRules) {
      const deptAllowed =
        rule.allowedDepartments === "ALL" ||
        (Array.isArray(rule.allowedDepartments) &&
          rule.allowedDepartments.includes(request.department));

      if (!deptAllowed) continue;

      if (rule.maxExecutionsPerHour) {
        if (!this.checkRateLimit(rule.id, rule.maxExecutionsPerHour)) {
          return {
            allowed: false,
            requiresApproval: false,
            reason: `Rate limit exceeded for ${request.toolName} (${rule.maxExecutionsPerHour}/hr).`,
          };
        }
      }

      const violated = this.validateConstraints(
        request.arguments,
        rule.parameterConstraints || [],
      );
      if (violated.length > 0) {
        return {
          allowed: false,
          requiresApproval: false,
          reason: `Parameter constraints violated: ${violated.map((c) => c.field).join(", ")}`,
        };
      }

      if (rule.level === "deny") {
        return { allowed: false, requiresApproval: false, reason: rule.description };
      }
      if (rule.level === "require_approval") {
        return {
          allowed: false,
          requiresApproval: true,
          reason: rule.description,
          appliedConstraints: rule.parameterConstraints,
        };
      }

      const thresholdBreach = this.checkParameterThresholds(
        request.arguments,
        rule.parameterConstraints || [],
      );
      if (thresholdBreach) {
        return {
          allowed: false,
          requiresApproval: true,
          reason: `Parameter threshold exceeded: ${thresholdBreach}`,
          appliedConstraints: rule.parameterConstraints,
        };
      }

      this.incrementRateLimit(rule.id);
      return {
        allowed: true,
        requiresApproval: false,
        reason: "Access granted.",
        appliedConstraints: rule.parameterConstraints,
      };
    }

    return {
      allowed: false,
      requiresApproval: false,
      reason: `Department '${request.department}' is not authorized to use '${request.toolName}'.`,
    };
  }

  private static validateConstraints(
    args: Record<string, any>,
    constraints: ParameterConstraint[],
  ): ParameterConstraint[] {
    const violated: ParameterConstraint[] = [];
    for (const constraint of constraints) {
      const value = args[constraint.field];
      switch (constraint.operator) {
        case "equals":
          if (value !== constraint.value) violated.push(constraint);
          break;
        case "not_equals":
          if (value === constraint.value) violated.push(constraint);
          break;
        case "contains":
          if (!String(value ?? "").includes(constraint.value)) violated.push(constraint);
          break;
        case "max_value":
          // handled separately as an approval threshold, not a hard block here
          break;
        case "min_value":
          if (Number(value) < constraint.value) violated.push(constraint);
          break;
        case "regex":
          if (!new RegExp(constraint.value).test(String(value ?? ""))) violated.push(constraint);
          break;
      }
    }
    return violated;
  }

  private static checkParameterThresholds(
    args: Record<string, any>,
    constraints: ParameterConstraint[],
  ): string | null {
    for (const constraint of constraints) {
      const value = args[constraint.field];
      if (constraint.operator === "max_value" && Number(value) > constraint.value) {
        return `${constraint.field} (${value}) exceeds max allowed (${constraint.value})`;
      }
    }
    return null;
  }

  private static checkRateLimit(ruleId: string, maxPerHour: number): boolean {
    const record = this.executionCounts.get(ruleId);
    const now = Date.now();
    if (!record || now > record.resetAt) return true;
    return record.count < maxPerHour;
  }

  private static incrementRateLimit(ruleId: string) {
    const record = this.executionCounts.get(ruleId);
    const now = Date.now();
    const oneHour = 3_600_000;
    if (!record || now > record.resetAt) {
      this.executionCounts.set(ruleId, { count: 1, resetAt: now + oneHour });
    } else {
      record.count++;
    }
  }
}

DepartmentToolPermissions.initializeDefaultRules();