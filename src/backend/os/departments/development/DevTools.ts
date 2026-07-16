import { z } from "zod";
import { globalToolRegistry } from "../../../tools/ToolRegistry";
import { DepartmentToolPermissions } from "../../permissions/DepartmentToolPermissions";
import type { ToolResult } from "../../../tools/types";

function ok(data: any, start: number): ToolResult {
  return { success: true, data, executionTimeMs: Date.now() - start };
}

export function initializeDevelopmentTools() {
  console.log("[Development] Registering Dev Tools & Zero-Trust Permissions...");

  if (!globalToolRegistry.has("execute_terminal_command")) {
    globalToolRegistry.register({
      name: "execute_terminal_command",
      description: "Executes a shell command in the sandboxed CI/CD or local environment.",
      parameters: z.object({
        command: z.string(),
        environment: z.enum(["local", "ci", "staging", "production"]),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ output: "Command executed successfully." }, s);
      },
    });
  }

  if (!globalToolRegistry.has("push_to_git")) {
    globalToolRegistry.register({
      name: "push_to_git",
      description: "Commits and pushes code changes to the remote Git repository.",
      parameters: z.object({
        branch: z.string(),
        commitMessage: z.string(),
        forcePush: z.boolean().default(false),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ commitHash: "a1b2c3d" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("deploy_to_environment")) {
    globalToolRegistry.register({
      name: "deploy_to_environment",
      description: "Triggers a deployment pipeline to the specified environment.",
      parameters: z.object({
        environment: z.enum(["staging", "production"]),
        version: z.string(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ deploymentId: "deploy_987" }, s);
      },
    });
  }

  if (!globalToolRegistry.has("run_database_migration")) {
    globalToolRegistry.register({
      name: "run_database_migration",
      description: "Executes a SQL migration script against the database.",
      parameters: z.object({
        scriptName: z.string(),
        environment: z.enum(["staging", "production"]),
        isDestructive: z.boolean(),
      }),
      execute: async () => {
        const s = Date.now();
        return ok({ rowsAffected: 0 }, s);
      },
    });
  }

  DepartmentToolPermissions.addRule({
    id: "dev_block_destructive_cmds",
    toolName: "execute_terminal_command",
    allowedDepartments: ["development", "operations"],
    level: "deny",
    parameterConstraints: [
      { field: "command", operator: "regex", value: "(rm\\s+-rf\\s+/|format\\s+c:|mkfs|dd\\s+if=)" },
      { field: "command", operator: "regex", value: "(chmod\\s+-R\\s+777\\s+/)" },
    ],
    description: "CRITICAL: Destructive system commands are strictly blocked at the kernel level.",
  });

  DepartmentToolPermissions.addRule({
    id: "dev_prod_deploy_approval",
    toolName: "deploy_to_environment",
    allowedDepartments: ["development"],
    level: "require_approval",
    parameterConstraints: [{ field: "environment", operator: "eq", value: "production" }],
    description: "All production deployments require CTO/Lead approval via the Human Approval System.",
  });

  DepartmentToolPermissions.addRule({
    id: "dev_block_destructive_db",
    toolName: "run_database_migration",
    allowedDepartments: ["development"],
    level: "deny",
    parameterConstraints: [
      { field: "environment", operator: "eq", value: "production" },
      { field: "isDestructive", operator: "eq", value: true },
    ],
    description: "Destructive database migrations (DROP/ALTER) are forbidden in production.",
  });

  DepartmentToolPermissions.addRule({
    id: "dev_block_force_push_main",
    toolName: "push_to_git",
    allowedDepartments: ["development"],
    level: "deny",
    parameterConstraints: [
      { field: "forcePush", operator: "eq", value: true },
      { field: "branch", operator: "regex", value: "^(main|master|prod)$" },
    ],
    description: "Force pushing to protected branches (main/master) is strictly forbidden.",
  });
}