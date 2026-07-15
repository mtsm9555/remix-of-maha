// src/backend/tools/builtins/CalculatorTool.ts
import { z } from "zod";
import { ToolDefinition } from "../types";

function safeEvaluate(expr: string): number {
  const sanitized = expr
    .replace(/[^0-9+\-*/().\s\w]/g, "")
    .replace(/\b(?!sqrt|pow|abs|sin|cos|tan|log|exp|PI|E|min|max|round|ceil|floor)\w+/g, "");
  const scope = {
    sqrt: Math.sqrt, pow: Math.pow, abs: Math.abs,
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    log: Math.log, exp: Math.exp, min: Math.min, max: Math.max,
    round: Math.round, ceil: Math.ceil, floor: Math.floor,
    PI: Math.PI, E: Math.E,
  };
  const fn = new Function(...Object.keys(scope), `return (${sanitized})`);
  const r = fn(...Object.values(scope));
  if (typeof r !== "number" || !isFinite(r)) throw new Error("Invalid mathematical expression or result");
  return r;
}

export const CalculatorTool: ToolDefinition = {
  name: "calculator",
  description: "Evaluate mathematical expressions safely.",
  requiresAuth: false,
  parameters: z.object({
    expression: z.string().min(1),
    precision: z.number().int().min(0).max(20).optional().default(10),
  }),
  execute: async (args) => {
    const start = Date.now();
    try {
      const result = safeEvaluate(args.expression);
      return {
        success: true,
        data: { expression: args.expression, result: Number(result.toFixed(args.precision)), evaluated: true },
        executionTimeMs: Date.now() - start,
      };
    } catch (e: any) {
      return { success: false, error: e?.message ?? String(e), executionTimeMs: Date.now() - start };
    }
  },
};
