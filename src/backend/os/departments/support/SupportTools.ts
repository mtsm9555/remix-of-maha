import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import { z } from "zod";

export function initializeSupportTools() {
  console.log("[Support] Registering Support Tools & Brand-Safety Permissions...");

  globalToolRegistry.register({
    name: "send_customer_reply",
    description: "Sends a direct email or chat reply to a customer regarding their support ticket.",
    parameters: z.object({
      ticketId: z.string(),
      customerEmail: z.string().email(),
      subject: z.string(),
      body: z.string(),
    }),
    execute: async () => ({ success: true, messageId: "msg_support_123" } as any),
  });

  globalToolRegistry.register({
    name: "issue_account_credit",
    description: "Issues a partial or full refund/credit to a customer's account balance.",
    parameters: z.object({
      customerId: z.string(),
      amountUSD: z.number().positive(),
      reason: z.string(),
      ticketId: z.string(),
    }),
    execute: async () => ({ success: true, creditId: "crd_99887", newBalance: 0 } as any),
  });

  globalToolRegistry.register({
    name: "update_public_knowledge_base",
    description: "Publishes or updates a help center article visible to all customers.",
    parameters: z.object({
      articleId: z.string().optional(),
      title: z.string(),
      content: z.string(),
      category: z.enum(["getting_started", "billing", "technical", "api"]),
    }),
    execute: async () => ({ success: true, articleUrl: "https://help.company.com/article/123" } as any),
  });

  globalToolRegistry.register({
    name: "escalate_to_human_agent",
    description: "Transfers a ticket from the AI support queue to a human support specialist.",
    parameters: z.object({
      ticketId: z.string(),
      reason: z.string(),
      priority: z.enum(["normal", "high", "urgent"]),
    }),
    execute: async () => ({ success: true, assignedTo: "human_agent_sarah" } as any),
  });

  DepartmentToolPermissions.addRule({
    id: "support_credit_limits",
    toolName: "issue_account_credit",
    allowedDepartments: ["support"],
    level: "require_approval",
    parameterConstraints: [{ field: "amountUSD", operator: "gt", value: 50 }],
    description: "Account credits over $50 require Support Manager approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "support_block_massive_refunds",
    toolName: "issue_account_credit",
    allowedDepartments: ["support"],
    level: "deny",
    parameterConstraints: [{ field: "amountUSD", operator: "gt", value: 500 }],
    description: "CRITICAL: AI agents are strictly forbidden from issuing credits over $500.",
  });

  DepartmentToolPermissions.addRule({
    id: "support_kb_approval",
    toolName: "update_public_knowledge_base",
    allowedDepartments: ["support"],
    level: "require_approval",
    description: "All public help center articles require human editorial review to prevent AI hallucinations.",
  });

  DepartmentToolPermissions.addRule({
    id: "support_no_internal_leaks",
    toolName: "send_customer_reply",
    allowedDepartments: ["support"],
    level: "deny",
    parameterConstraints: [{ field: "customerEmail", operator: "regex", value: ".*@company\\.com$" }],
    description: "Customer reply tools cannot be used to email internal company domains.",
  });
}