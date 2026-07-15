import type { ToolResult } from "./types";

export async function weatherTool(): Promise<ToolResult> {
  const response = await fetch(
    "https://api.open-meteo.com/v1/forecast?latitude=31.5&longitude=74.3&current_weather=true"
  );
  const data = await response.json();
  return { success: true, tool: "weather", data };
}