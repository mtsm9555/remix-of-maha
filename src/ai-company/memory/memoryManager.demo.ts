import { MemoryStore } from "./memoryStore";
import { MemoryManager } from "./memoryManager";

const memoryStore = new MemoryStore();
const memoryManager = new MemoryManager(memoryStore);

console.log(memoryManager.rememberDecision("system", "Use one manager layer for all agents"));
console.log(memoryManager.rememberNote("agent-1", "Task completed successfully"));

console.log("System Memory:", memoryStore.getMemoriesByOwner("system"));
console.log("Agent Memory:", memoryStore.getMemoriesByOwner("agent-1"));
