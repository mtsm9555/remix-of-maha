import type { ToolResult } from "./types";

const tasks: string[] = [];

export async function taskTool(input: string): Promise<ToolResult> {
  tasks.push(input);
  return { success: true, tool: "tasks", data: [...tasks] };
}