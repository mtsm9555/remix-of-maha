// src/backend/tools/builtins/CalculatorTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class CalculatorTool extends BaseTool {
  schema: ToolSchema = {
    name: "calculator",
    description: "Evaluate mathematical expressions safely.",
    category: "calc",
    risk: "safe",
    parameters: [
      {
        name: "expression",
        type: "string",
        description: "Mathematical expression to evaluate (e.g., '2 + 2 * 3', 'sqrt(16)', 'sin(PI/2)')",
        required: true,
      },
      {
        name: "precision",
        type: "number",
        description: "Decimal precision for the result",
        required: false,
        default: 10,
      },
    ],
    returns: {
      type: "number",
      description: "The evaluated result",
    },
    examples: [
      '{ "expression": "2 + 2 * 3" }',
      '{ "expression": "sqrt(16) + pow(2, 3)" }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const expression = params.expression as string;
    const precision = params.precision ?? 10;

    // Safe evaluation — only allow math functions and numbers
    const result = this.safeEvaluate(expression);
    return {
      expression,
      result: Number(result.toFixed(precision)),
      evaluated: true,
    };
  }

  private safeEvaluate(expr: string): number {
    // Whitelist of allowed characters and functions
    const sanitized = expr
      .replace(/[^0-9+\-*/().\s\w]/g, "")
      .replace(/\b(?!sqrt|pow|abs|sin|cos|tan|log|exp|PI|E|min|max|round|ceil|floor)\w+/g, "");

    // Build safe math scope
    const scope = {
      sqrt: Math.sqrt,
      pow: Math.pow,
      abs: Math.abs,
      sin: Math.sin,
      cos: Math.cos,
      tan: Math.tan,
      log: Math.log,
      exp: Math.exp,
      min: Math.min,
      max: Math.max,
      round: Math.round,
      ceil: Math.ceil,
      floor: Math.floor,
      PI: Math.PI,
      E: Math.E,
    };

    // Use Function constructor with limited scope
    const fn = new Function(...Object.keys(scope), `return (${sanitized})`);
    const result = fn(...Object.values(scope));

    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error("Invalid mathematical expression or result");
    }

    return result;
  }
}
