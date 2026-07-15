// src/backend/tools/builtins/ShellCommandTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class ShellCommandTool extends BaseTool {
  schema: ToolSchema = {
    name: "shell_command",
    description: "Execute a shell command in a restricted environment.",
    category: "shell",
    risk: "critical",
    parameters: [
      {
        name: "command",
        type: "string",
        description: "Shell command to execute",
        required: true,
      },
      {
        name: "cwd",
        type: "string",
        description: "Working directory for the command",
        required: false,
        default: ".",
      },
      {
        name: "timeout",
        type: "number",
        description: "Timeout in milliseconds (max 60000)",
        required: false,
        default: 10000,
      },
      {
        name: "env",
        type: "object",
        description: "Environment variables to set",
        required: false,
      },
    ],
    returns: {
      type: "object",
      description: "stdout, stderr, and exit code",
    },
    examples: [
      '{ "command": "ls -la" }',
      '{ "command": "git log --oneline -5" }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const command = params.command as string;
    const cwd = params.cwd ?? ".";
    const timeout = Math.min(params.timeout ?? 10000, 60000);
    const env = params.env ?? {};

    // CRITICAL SECURITY: Only allow in Docker sandbox or restricted environments
    // Block dangerous commands
    const blockedPatterns = [
      /rm\s+-rf\s*\//i,
      />\s*\//i,
      /mkfs/i,
      /dd\s+if/i,
      /curl\s+.*\|\s*sh/i,
      /wget\s+.*\|\s*sh/i,
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        throw new Error(`Command blocked for security: ${command}`);
      }
    }

    if (typeof globalThis !== "undefined" && (globalThis as any).execCommand) {
      return await (globalThis as any).execCommand(command, { cwd, timeout, env });
    }

    return {
      stdout: "",
      stderr: "[SHELL NOT AVAILABLE] Command execution requires Node.js child_process or Docker sandbox",
      exitCode: -1,
      command,
      warning: "Shell commands require a secure sandbox environment",
    };
  }
}
