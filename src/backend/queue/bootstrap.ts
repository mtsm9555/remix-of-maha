import { QueueManager } from "./QueueManager";
import { QueueRegistry } from "./QueueRegistry";
import { JobDispatcher } from "./JobDispatcher";
import { watch } from "./events/QueueEvents";

const manager = new QueueManager();
const registry = new QueueRegistry();

const names = ["agent", "memory", "vision", "tool", "voice", "automation"] as const;
for (const name of names) {
  const q = manager.create(name);
  registry.register(name, q);
  watch(q);
}

export const queueRegistry = registry;
export const dispatchers = Object.fromEntries(
  names.map((n) => [n, new JobDispatcher(registry.get(n)!)]),
) as Record<(typeof names)[number], JobDispatcher>;