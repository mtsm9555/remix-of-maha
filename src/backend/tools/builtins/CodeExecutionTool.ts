// src/backend/tools/builtins/CodeExecutionTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

export const CodeExecutionTool: ToolDefinition = {
  name: "code_execution",
  description: "Execute Python or JavaScript code in a sandboxed environment.",
  requiresAuth: true,
  parameters: z.object({
    language: z.enum(["python", "javascript"]),
    code: z.string().min(1),
    timeout: z.number().int().positive().max(30000).optional().default(5000),
    stdin: z.string().optional(),
  }),
  execute: async (args) => {
    const start = Date.now();
    try {
      if (process.env.USE_E2B_SANDBOX === "true") {
        const r = await fetch("https://api.e2b.dev/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.E2B_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ language: args.language, code: args.code, timeout: args.timeout }),
        });
        if (!r.ok) throw new Error(`E2B API error: ${r.status}`);
        const d = await r.json();
        return {
          success: true,
          data: { stdout: d.stdout ?? "", stderr: d.stderr ?? "", exitCode: d.exitCode ?? 0, source: "e2b" },
          executionTimeMs: Date.now() - start,
        };
      }
      return {
        success: true,
        data: {
          stdout: `[SANDBOX REQUIRED] Code execution disabled.\nLanguage: ${args.language}\nCode length: ${args.code.length} chars`,
          stderr: "",
          exitCode: 0,
          warning: "Enable USE_E2B_SANDBOX for real execution",
        },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
