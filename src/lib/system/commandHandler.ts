import { mahaBus } from "./eventBus";
import { detectTool } from "./toolRouter";

export async function handleCommand(input: string) {
  mahaBus.emit("thinking:start");
  const tool = detectTool(input);
  if (tool) {
    mahaBus.emit("tool:start", { name: tool });
    await new Promise((r) => setTimeout(r, 1500));
    mahaBus.emit("tool:end", { name: tool });
  }
  mahaBus.emit("thinking:end");
}
