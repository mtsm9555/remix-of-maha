import { z } from "zod";
import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import type { ToolResult } from "../../../tools/types";

function ok(data: any, start: number): ToolResult {
  return { success: true, data, executionTimeMs: Date.now() - start };
}

export function initializeOperationsTools() {
  console.log("[Operations] Registering Ops Tools & Blast-Radius Permissions...");

  if (!globalToolRegistry.has("execute_browser_automation")) {
    globalToolRegistry.register({
      name: "execute_browser_automation",
      description:
        "Automates browser tasks (filling forms, scraping data, clicking buttons) using Playwright.",
      parameters: z.object({
        url: z.string().url(),
        actions: z.array(z.string()),
        headless: z.boolean().default(true),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ screenshots: ["img_1.png"], dataExtracted: {} }, s);
      },
    });
  }

  if (!globalToolRegistry.has("send_internal_broadcast")) {
    globalToolRegistry.register({
      name: "send_internal_broadcast",
      description:
        "Sends a message to an internal communication channel (Slack, Teams, Email).",
      parameters: z.object({
        channel: z.string(),
        message: z.string(),
        priority: z.enum(["low", "normal", "high", "critical"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ messageId: "msg_ops_123" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("restart_service")) {
    globalToolRegistry.register({
      name: "restart_service",
      description: "Restarts a specific internal microservice or container.",
      parameters: z.object({
        serviceName: z.string(),
        environment: z.enum(["staging", "production"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ status: "restarting" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("provision_vendor_license")) {
    globalToolRegistry.register({
      name: "provision_vendor_license",
      description:
        "Automatically provisions a new software license or seat via vendor API.",
      parameters: z.object({
        vendor: z.string(),
        userEmail: z.string().email(),
        planType: z.string(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ licenseKey: "LIC-999" }, s);
      },
    });
  }

  DepartmentToolPermissions.addRule({
    id: "ops_broadcast_rate_limit",
    toolName: "send_internal_broadcast",
    allowedDepartments: ["operations"],
    level: "require_approval",
    parameterConstraints: [
      { field: "channel", operator: "eq", value: "all-hands" },
      { field: "priority", operator: "in", value: ["high", "critical"] },
    ],
    maxExecutionsPerHour: 2,
    description:
      "Mass internal broadcasts or high-priority alerts require COO approval and are rate-limited.",
  });

  DepartmentToolPermissions.addRule({
    id: "ops_block_prod_restart",
    toolName: "restart_service",
    allowedDepartments: ["operations", "development"],
    level: "require_approval",
    parameterConstraints: [
      { field: "environment", operator: "eq", value: "production" },
      { field: "serviceName", operator: "regex", value: "^(database|auth|payment-gateway)$" },
    ],
    description:
      "Restarting critical production services (DB, Auth, Payments) ALWAYS requires human approval.",
  });

  DepartmentToolPermissions.addRule({
    id: "ops_browser_domain_allowlist",
    toolName: "execute_browser_automation",
    allowedDepartments: ["operations", "marketing"],
    level: "deny",
    parameterConstraints: [
      { field: "url", operator: "regex", value: "^(?!https://(admin\\.company\\.com|bank\\.com)).*$" },
    ],
    description:
      "Browser automation is strictly forbidden on internal admin panels or financial domains.",
  });
}