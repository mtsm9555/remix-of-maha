// src/backend/tools/ToolPermissionEngine.ts
import { ToolPolicy, ToolRiskLevel, ToolSchema, ToolCategory } from "./types";
import { Logger } from "../observability/Logger";

export interface PermissionResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason?: string;
}

export class ToolPermissionEngine {
  private policies = new Map<string, ToolPolicy>();
  private logger = new Logger();

  setPolicy(policy: ToolPolicy): void {
    this.policies.set(policy.userId, policy);
  }

  getPolicy(userId: string): ToolPolicy {
    return (
      this.policies.get(userId) ?? {
        userId,
        allowedCategories: [
          "web", "browser", "code", "file", "calc", "http", "memory", "vision", "custom",
        ],
        blockedTools: [],
        maxRiskLevel: "high",
        requireApprovalAbove: "medium",
        dailyQuota: 1000,
        usedQuota: 0,
      }
    );
  }

  check(toolSchema: ToolSchema, userId: string): PermissionResult {
    const policy = this.getPolicy(userId);

    // Quota check
    if (policy.usedQuota >= policy.dailyQuota) {
      return { allowed: false, requiresApproval: false, reason: "Daily tool quota exceeded" };
    }

    // Blocked tool check
    if (policy.blockedTools.includes(toolSchema.name)) {
      return { allowed: false, requiresApproval: false, reason: `Tool ${toolSchema.name} is blocked` };
    }

    // Category check
    if (!policy.allowedCategories.includes(toolSchema.category)) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Category ${toolSchema.category} is not allowed`,
      };
    }

    // Risk level check
    const riskOrder: ToolRiskLevel[] = ["safe", "low", "medium", "high", "critical"];
    const toolRiskIndex = riskOrder.indexOf(toolSchema.risk);
    const maxRiskIndex = riskOrder.indexOf(policy.maxRiskLevel);

    if (toolRiskIndex > maxRiskIndex) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Risk level ${toolSchema.risk} exceeds maximum allowed ${policy.maxRiskLevel}`,
      };
    }

    // Approval requirement
    const approvalIndex = riskOrder.indexOf(policy.requireApprovalAbove);
    const requiresApproval = toolRiskIndex >= approvalIndex;

    return { allowed: true, requiresApproval };
  }

  incrementQuota(userId: string): void {
    const policy = this.getPolicy(userId);
    policy.usedQuota += 1;
    this.policies.set(userId, policy);
  }

  resetQuota(userId: string): void {
    const policy = this.getPolicy(userId);
    policy.usedQuota = 0;
    this.policies.set(userId, policy);
  }
}

export const toolPermissionEngine = new ToolPermissionEngine();
