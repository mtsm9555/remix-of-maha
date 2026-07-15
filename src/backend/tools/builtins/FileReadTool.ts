// src/backend/tools/builtins/FileReadTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class FileReadTool extends BaseTool {
  schema: ToolSchema = {
    name: "file_read",
    description: "Read the contents of a file from the workspace.",
    category: "file",
    risk: "low",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Relative path to the file within the workspace",
        required: true,
      },
      {
        name: "encoding",
        type: "string",
        description: "File encoding",
        required: false,
        default: "utf-8",
        enum: ["utf-8", "base64", "binary"],
      },
      {
        name: "limit",
        type: "number",
        description: "Maximum number of lines to read (0 = unlimited)",
        required: false,
        default: 0,
      },
    ],
    returns: {
      type: "object",
      description: "File content, size, and metadata",
    },
    examples: [
      '{ "path": "data/config.json" }',
      '{ "path": "logs/app.log", "limit": 100 }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const path = params.path as string;
    const encoding = params.encoding ?? "utf-8";
    const limit = params.limit ?? 0;

    // Security: validate path is within workspace
    const safePath = this.sanitizePath(path);

    // Production: use actual file system with workspace root
    // This skeleton provides the interface
    if (typeof globalThis !== "undefined" && (globalThis as any).readFile) {
      const content = await (globalThis as any).readFile(safePath, encoding);
      const lines = content.split("\n");
      const truncated = limit > 0 ? lines.slice(0, limit).join("\n") : content;

      return {
        path: safePath,
        content: truncated,
        lines: lines.length,
        truncated: limit > 0 && lines.length > limit,
        size: content.length,
        encoding,
      };
    }

    // Fallback for browser/development
    return {
      path: safePath,
      content: `[FILE SYSTEM NOT AVAILABLE] Would read: ${safePath}`,
      lines: 0,
      truncated: false,
      size: 0,
      encoding,
      warning: "File system access requires Node.js environment or configured storage adapter",
    };
  }

  private sanitizePath(path: string): string {
    // Prevent directory traversal
    return path
      .replace(/\.\./g, "")
      .replace(/^\//, "")
      .replace(/\/\//g, "/");
  }
}
