// src/backend/tools/builtins/HttpRequestTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

export const HttpRequestTool: ToolDefinition = {
  name: "http_request",
  description: "Make an HTTP request to any API endpoint.",
  requiresAuth: false,
  parameters: z.object({
    url: z.string().url(),
    method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"]).optional().default("GET"),
    headers: z.record(z.string(), z.string()).optional().default({}),
    body: z.string().optional(),
    timeout: z.number().int().positive().max(60000).optional().default(10000),
  }),
  execute: async (args) => {
    const start = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), args.timeout);
    try {
      const response = await fetch(args.url, {
        method: args.method,
        headers: { "User-Agent": "MahaBot/1.0", ...args.headers },
        body: args.body,
        signal: controller.signal,
      });
      clearTimeout(timer);
      const raw = await response.text();
      let body: any = raw;
      try { body = JSON.parse(raw); } catch {}
      return {
        success: true,
        data: {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body,
          url: response.url,
        },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      clearTimeout(timer);
      const msg = e?.name === "AbortError" ? `HTTP request timed out after ${args.timeout}ms` : (e?.message ?? String(e));
      return { success: false, error: msg, executionTimeMs: Date.now() - start };
    }
  },
};
