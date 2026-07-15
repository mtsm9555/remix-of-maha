// src/backend/tools/builtins/FileWriteTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class FileWriteTool extends BaseTool {
  schema: ToolSchema = {
    name: "file_write",
    description: "Write content to a file in the workspace.",
    category: "file",
    risk: "medium",
    parameters: [
      {
        name: "path",
        type: "string",
        description: "Relative path to the file",
        required: true,
      },
      {
        name: "content",
        type: "string",
        description: "Content to write",
        required: true,
      },
      {
        name: "append",
        type: "boolean",
        description: "Append to existing file instead of overwriting",
        required: false,
        default: false,
      },
      {
        name: "encoding",
        type: "string",
        description: "File encoding",
        required: false,
        default: "utf-8",
      },
    ],
    returns: {
      type: "object",
      description: "Write confirmation with bytes written",
    },
    examples: [
      '{ "path": "output/report.md", "content": "# Report\n\nSummary..." }',
      '{ "path": "logs/events.log", "content": "New event\n", "append": true }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const path = params.path as string;
    const content = params.content as string;
    const append = params.append ?? false;
    const encoding = params.encoding ?? "utf-8";
    const safePath = this.sanitizePath(path);

    if (typeof globalThis !== "undefined" && (globalThis as any).writeFile) {
      await (globalThis as any).writeFile(safePath, content, { append, encoding });
      return {
        path: safePath,
        bytesWritten: content.length,
        append,
        encoding,
      };
    }

    return {
      path: safePath,
      bytesWritten: 0,
      append,
      encoding,
      warning: "File system write requires Node.js environment",
    };
  }

  private sanitizePath(path: string): string {
    return path
      .replace(/\.\./g, "")
      .replace(/^\//, "")
      .replace(/\/\//g, "/");
  }
}
