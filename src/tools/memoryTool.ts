import type { ToolResult } from "./types";
import { memoryEngine } from "@/memory";

export async function memoryTool(input: string): Promise<ToolResult> {
  const memory = await memoryEngine.store("local-user", input);
  return {
    success: true,
    tool: "memory",
    data: { id: memory.id, content: memory.content, type: memory.type },
  };
}