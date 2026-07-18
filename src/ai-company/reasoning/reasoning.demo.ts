// src/index.ts

import { ReasoningEngine } from "./reasoningEngine";
import { ReasoningMemory } from "./reasoningMemory";
import { ReasoningManager } from "./reasoningManager";

const engine = new ReasoningEngine();
const memory = new ReasoningMemory();
const manager = new ReasoningManager(engine, memory);

const result = manager.run({
  agentId: "agent-1",
  goal: "Build a support agent that answers customer questions",
  context: {
    priority: "high",
    domain: "support",
  },
});

console.log(JSON.stringify(result, null, 2));
console.log("Saved reasoning history:", memory.getAll());
