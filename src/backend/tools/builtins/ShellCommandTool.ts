// src/backend/tools/builtins/ShellCommandTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

const BLOCKED = [
  /rm\s+-rf\s*\//i, />\s*\//i, /mkfs/i, /dd\s+if/i,
  /curl\s+.*\|\s*sh/i, /wget\s+.*\|\s*sh/i,
];

export const ShellCommandTool: ToolDefinition = {
  name: "shell_command",
  description: "Execute a shell command in a restricted sandbox.",
  requiresAuth: true,
  parameters: z.object({
    command: z.string().min(1),
    cwd: z.string().optional().default("."),
    timeout: z.number().int().positive().max(60000).optional().default(10000),
    env: z.record(z.string(), z.string()).optional(),
  }),
  execute: async (args) => {
    const start = Date.now();
    try {
      for (const p of BLOCKED) {
        if (p.test(args.command)) throw new Error(`Command blocked for security: ${args.command}`);
      }
      const exec = (globalThis as any).execCommand;
      if (typeof exec === "function") {
        const r = await exec(args.command, { cwd: args.cwd, timeout: args.timeout, env: args.env });
        return { success: true, data: r, executionTimeMs: Date.now() - start };
      }
      return {
        success: true,
        data: {
          stdout: "", stderr: "[SHELL NOT AVAILABLE] Requires sandboxed adapter",
          exitCode: -1, command: args.command,
        },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
