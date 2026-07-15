import type { QueueLike } from "../InMemoryQueue";

interface ToolRouterLike {
  execute(data: any): Promise<any>;
}

export function startToolWorker(queue: QueueLike, toolRouter: ToolRouterLike) {
  queue.process(async (job) => toolRouter.execute(job.payload));
  return queue;
}