import { z } from "zod";
import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import type { ToolResult } from "../../../tools/types";

function ok(data: any, start: number): ToolResult {
  return { success: true, data, executionTimeMs: Date.now() - start };
}

export function initializeSalesTools() {
  console.log("[Sales] Registering Sales Tools & Strict Permissions...");

  if (!globalToolRegistry.has("enrich_lead_data")) {
    globalToolRegistry.register({
      name: "enrich_lead_data",
      description:
        "Fetches firmographic and technographic data for a lead from external APIs (e.g., Clearbit, Apollo).",
      parameters: z.object({
        companyDomain: z.string(),
        contactEmail: z.string().email(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ revenue: "$10M", employees: 50, techStack: ["AWS", "React"] }, s);
      },
    });
  }

  if (!globalToolRegistry.has("update_crm_pipeline")) {
    globalToolRegistry.register({
      name: "update_crm_pipeline",
      description:
        "Updates the status and value of a deal in the CRM (e.g., Salesforce, HubSpot).",
      parameters: z.object({
        dealId: z.string(),
        stage: z.string(),
        valueUSD: z.number(),
      }),
      execute: async (args) => {
        const s = Date.now();
        return ok({ message: `Deal ${args.dealId} moved to ${args.stage}` }, s);
      },
    });
  }

  if (!globalToolRegistry.has("send_sales_outreach")) {
    globalToolRegistry.register({
      name: "send_sales_outreach",
      description: "Sends a personalized cold email or LinkedIn message to a prospect.",
      parameters: z.object({
        recipientEmail: z.string().email(),
        subject: z.string(),
        body: z.string(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ messageId: "msg_98765" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("send_internal_notification")) {
    globalToolRegistry.register({
      name: "send_internal_notification",
      description: "Sends an internal notification to a team member (e.g., Slack, email).",
      parameters: z.object({
        recipient: z.string(),
        message: z.string(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ delivered: true }, s);
      },
    });
  }

  if (!globalToolRegistry.has("generate_sales_proposal")) {
    globalToolRegistry.register({
      name: "generate_sales_proposal",
      description: "Generates a formal pricing proposal and contract for a client.",
      parameters: z.object({
        clientName: z.string(),
        basePriceUSD: z.number(),
        discountPercentage: z.number().min(0).max(50),
      }),
      execute: async (args) => {
        const s = Date.now();
        const finalPrice = args.basePriceUSD * (1 - args.discountPercentage / 100);
        return ok(
          { finalPriceUSD: finalPrice, documentUrl: "https://docs.company.com/prop_123.pdf" },
          s,
        );
      },
    });
  }

  DepartmentToolPermissions.addRule({
    id: "sales_no_internal_spam",
    toolName: "send_sales_outreach",
    allowedDepartments: ["sales", "marketing"],
    level: "deny",
    parameterConstraints: [
      { field: "recipientEmail", operator: "regex", value: ".*@company\\.com$" },
    ],
    description:
      "Sales agents are strictly forbidden from sending cold outreach to internal company domains.",
  });

  DepartmentToolPermissions.addRule({
    id: "sales_discount_limits",
    toolName: "generate_sales_proposal",
    allowedDepartments: ["sales"],
    level: "require_approval",
    parameterConstraints: [
      { field: "discountPercentage", operator: "max_value", value: 15 },
    ],
    description: "Proposals with discounts over 15% require VP of Sales approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "sales_hard_block_discount",
    toolName: "generate_sales_proposal",
    allowedDepartments: ["sales"],
    level: "deny",
    parameterConstraints: [
      { field: "discountPercentage", operator: "gt", value: 30 },
    ],
    description:
      "Discounts over 30% are strictly forbidden and will be blocked by the Policy Engine.",
  });
}