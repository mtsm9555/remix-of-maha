import type { ToolName } from "@/tools/types";

export function routeTool(input: string): ToolName {
  const text = input.toLowerCase();

  if (text.includes("remember") || text.includes("save this")) {
    return "memory";
  }
  if (text.includes("weather")) {
    return "weather";
  }
  if (text.includes("task") || text.includes("todo")) {
    return "tasks";
  }
  if (text.includes("search") || text.includes("find")) {
    return "search";
  }
  return "none";
}