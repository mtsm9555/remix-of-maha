export type ToolName =
  | "memory"
  | "search"
  | "weather"
  | "tasks"
  | "none";

export interface ToolResult {
  success: boolean;
  tool: ToolName;
  data: any;
}