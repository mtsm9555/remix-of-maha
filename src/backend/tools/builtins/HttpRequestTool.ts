// src/backend/tools/builtins/HttpRequestTool.ts
import { BaseTool, ToolSchema, ToolExecutionContext } from "../types";

export class HttpRequestTool extends BaseTool {
  schema: ToolSchema = {
    name: "http_request",
    description: "Make an HTTP request to any API endpoint.",
    category: "http",
    risk: "medium",
    parameters: [
      {
        name: "url",
        type: "string",
        description: "Target URL",
        required: true,
      },
      {
        name: "method",
        type: "string",
        description: "HTTP method",
        required: false,
        default: "GET",
        enum: ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"],
      },
      {
        name: "headers",
        type: "object",
        description: "Request headers",
        required: false,
        default: {},
      },
      {
        name: "body",
        type: "string",
        description: "Request body (JSON string or raw)",
        required: false,
      },
      {
        name: "timeout",
        type: "number",
        description: "Request timeout in ms",
        required: false,
        default: 10000,
      },
    ],
    returns: {
      type: "object",
      description: "Response status, headers, and body",
    },
    examples: [
      '{ "url": "https://api.example.com/data", "method": "GET" }',
      '{ "url": "https://api.example.com/users", "method": "POST", "body": "{\"name\":\"John\"}", "headers": { "Content-Type": "application/json" } }',
    ],
  };

  async execute(params: Record<string, any>, _context: ToolExecutionContext): Promise<any> {
    const url = params.url as string;
    const method = params.method ?? "GET";
    const headers = params.headers ?? {};
    const body = params.body as string | undefined;
    const timeout = params.timeout ?? 10000;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "User-Agent": "MahaBot/1.0",
          ...headers,
        },
        body: body ? body : undefined,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const responseBody = await response.text();
      let parsedBody: any = responseBody;
      try {
        parsedBody = JSON.parse(responseBody);
      } catch {
        // Keep as string if not JSON
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: parsedBody,
        url: response.url,
      };
    } catch (error: any) {
      clearTimeout(timer);
      if (error.name === "AbortError") {
        throw new Error(`HTTP request timed out after ${timeout}ms`);
      }
      throw error;
    }
  }
}
