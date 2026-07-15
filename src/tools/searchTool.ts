import type { ToolResult } from "./types";

export async function searchTool(query: string): Promise<ToolResult> {
  return {
    success: true,
    tool: "search",
    data: {
      query,
      results: ["Search result 1", "Search result 2"],
    },
  };
}