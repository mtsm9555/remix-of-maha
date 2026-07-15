// src/backend/tools/builtins/CodeExecutionTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class CodeExecutionTool extends BaseTool {
  schema: ToolSchema = {
    name: "code_execution",
    description: "Execute Python or JavaScript code in a sandboxed environment.",
    category: "code",
    risk: "high",
    parameters: [
      {
        name: "language",
        type: "string",
        description: "Programming language to execute",
        required: true,
        enum: ["python", "javascript"],
      },
      {
        name: "code",
        type: "string",
        description: "The code to execute",
        required: true,
      },
      {
        name: "timeout",
        type: "number",
        description: "Execution timeout in milliseconds (max 30000)",
        required: false,
        default: 5000,
      },
      {
        name: "stdin",
        type: "string",
        description: "Input to provide to the program",
        required: false,
      },
    ],
    returns: {
      type: "object",
      description: "stdout, stderr, and exit code",
    },
    examples: [
      '{ "language": "python", "code": "print(2 + 2)" }',
      '{ "language": "javascript", "code": "console.log(Math.PI)" }',
    ],
  };

  async execute(params: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const language = params.language as string;
    const code = params.code as string;
    const timeout = Math.min(params.timeout ?? 5000, 30000);
    const stdin = params.stdin as string | undefined;

    // SECURITY: In production, run this in a Docker sandbox or E2B sandbox
    // Never execute arbitrary code directly on the host machine
    if (process.env.USE_E2B_SANDBOX === "true") {
      return this.executeE2B(language, code, timeout, stdin);
    }

    if (process.env.USE_DOCKER_SANDBOX === "true") {
      return this.executeDocker(language, code, timeout, stdin);
    }

    // Development fallback: return mock result with warning
    return {
      stdout: `[SANDBOX REQUIRED] Code execution is disabled in development mode.\nLanguage: ${language}\nCode length: ${code.length} chars`,
      stderr: "",
      exitCode: 0,
      warning: "Enable USE_E2B_SANDBOX or USE_DOCKER_SANDBOX for real execution",
    };
  }

  private async executeE2B(language: string, code: string, timeout: number, _stdin: string | undefined): Promise<any> {
    // E2B integration: https://e2b.dev
    const response = await fetch("https://api.e2b.dev/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.E2B_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        language,
        code,
        timeout,
      }),
    });

    if (!response.ok) {
      throw new Error(`E2B API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      stdout: data.stdout ?? "",
      stderr: data.stderr ?? "",
      exitCode: data.exitCode ?? 0,
      source: "e2b",
    };
  }

  private async executeDocker(language: string, code: string, timeout: number, _stdin: string | undefined): Promise<any> {
    // Docker sandbox execution skeleton
    // Requires: docker run --rm -i --memory=512m --cpus=0.5 sandbox-image
    throw new Error("Docker sandbox not yet implemented. Set USE_E2B_SANDBOX=true for production.");
  }
}
