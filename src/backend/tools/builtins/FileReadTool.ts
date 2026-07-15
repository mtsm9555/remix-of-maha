// src/backend/tools/builtins/FileReadTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

function sanitizePath(p: string): string {
  return p.replace(/\.\./g, "").replace(/^\//, "").replace(/\/\//g, "/");
}

export const FileReadTool: ToolDefinition = {
  name: "file_read",
  description: "Read the contents of a file from the workspace.",
  requiresAuth: false,
  parameters: z.object({
    path: z.string().min(1),
    encoding: z.enum(["utf-8", "base64", "binary"]).optional().default("utf-8"),
    limit: z.number().int().min(0).optional().default(0),
  }),
  execute: async (args) => {
    const start = Date.now();
    try {
      const safePath = sanitizePath(args.path);
      const rf = (globalThis as any).readFile;
      if (typeof rf === "function") {
        const content: string = await rf(safePath, args.encoding);
        const lines = content.split("\n");
        const truncated = args.limit > 0 ? lines.slice(0, args.limit).join("\n") : content;
        return {
          success: true,
          data: {
            path: safePath, content: truncated, lines: lines.length,
            truncated: args.limit > 0 && lines.length > args.limit,
            size: content.length, encoding: args.encoding,
          },
          executionTimeMs: Date.now() - start,
        };
      }
      return {
        success: true,
        data: {
          path: safePath, content: `[FILE SYSTEM NOT AVAILABLE]`,
          lines: 0, truncated: false, size: 0, encoding: args.encoding,
          warning: "File system access requires a configured storage adapter",
        },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
