export type ToolName = "search" | "weather" | "memory" | "calendar";

export function detectTool(input: string): ToolName | null {
  const text = input.toLowerCase();
  if (text.includes("weather")) return "weather";
  if (text.includes("remember") || text.includes("memory")) return "memory";
  if (text.includes("schedule") || text.includes("calendar")) return "calendar";
  if (text.includes("search") || text.includes("find")) return "search";
  return null;
}
