import { mahaBus } from "@/lib/system/eventBus";
import type { ToolName, ToolResult } from "./types";
import { memoryTool } from "./memoryTool";
import { searchTool } from "./searchTool";
import { weatherTool } from "./weatherTool";
import { taskTool } from "./taskTool";

export async function executeTool(
  tool: ToolName | string,
  input: string
): Promise<ToolResult> {
  mahaBus.emit("tool:start", { tool });
  try {
    switch (tool) {
      case "memory":
        return await memoryTool(input);
      case "search":
        return await searchTool(input);
      case "weather":
        return await weatherTool();
      case "tasks":
        return await taskTool(input);
      default:
        return { success: false, tool: "none", data: null };
    }
  } finally {
    mahaBus.emit("tool:end", { tool });
  }
}