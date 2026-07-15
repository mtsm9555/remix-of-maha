import { routeTool } from "@/router/toolRouter";
import { executeTool } from "@/tools/toolExecutor";

export async function plannerAgent(userInput: string) {
  const tool = routeTool(userInput);
  const result = await executeTool(tool, userInput);
  return result;
}