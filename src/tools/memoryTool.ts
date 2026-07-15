import { storeMemory } from "@/lib/memory/storeMemory";
import type { ToolResult } from "./types";

export async function memoryTool(input: string): Promise<ToolResult> {
  const result = await storeMemory(input);
  return { success: true, tool: "memory", data: result };
}