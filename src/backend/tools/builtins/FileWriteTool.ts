// src/backend/tools/builtins/FileWriteTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

function sanitizePath(p: string): string {
  return p.replace(/\.\./g, "").replace(/^\//, "").replace(/\/\//g, "/");
}

export const FileWriteTool: ToolDefinition = {
  name: "file_write",
  description: "Write content to a file in the workspace.",
  requiresAuth: true,
  parameters: z.object({
    path: z.string().min(1),
    content: z.string(),
    append: z.boolean().optional().default(false),
    encoding: z.string().optional().default("utf-8"),
  }),
  execute: async (args) => {
    const start = Date.now();
    try {
      const safePath = sanitizePath(args.path);
      const wf = (globalThis as any).writeFile;
      if (typeof wf === "function") {
        await wf(safePath, args.content, { append: args.append, encoding: args.encoding });
        return {
          success: true,
          data: { path: safePath, bytesWritten: args.content.length, append: args.append, encoding: args.encoding },
          executionTimeMs: Date.now() - start,
        };
      }
      return {
        success: true,
        data: { path: safePath, bytesWritten: 0, append: args.append, encoding: args.encoding, warning: "File system write requires a configured adapter" },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
