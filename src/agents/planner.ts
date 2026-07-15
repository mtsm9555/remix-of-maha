// src/agents/planner.ts

import { mahaBus } from "@/lib/system/eventBus";

export async function plannerAgent(userInput: string): Promise<string[]> {
  mahaBus.emit("agent:start", { name: "planner" });

  try {
    const tasks: string[] = [];
    const input = userInput.toLowerCase();

    if (input.includes("weather")) tasks.push("weather");
    if (input.includes("calendar")) tasks.push("calendar");

    return tasks;
  } finally {
    mahaBus.emit("agent:end", { name: "planner" });
  }
}
