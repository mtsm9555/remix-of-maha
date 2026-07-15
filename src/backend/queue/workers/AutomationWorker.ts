import type { QueueLike } from "../InMemoryQueue";

interface AutomationRuntimeLike {
  execute(data: any): Promise<any>;
}

export function startAutomationWorker(queue: QueueLike, automationRuntime: AutomationRuntimeLike) {
  queue.process(async (job) => automationRuntime.execute(job.payload));
  return queue;
}