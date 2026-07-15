import type { QueueLike } from "../InMemoryQueue";

interface MemoryEngineLike {
  store(userId: string, content: string): Promise<any>;
}

export function startMemoryWorker(queue: QueueLike, memoryEngine: MemoryEngineLike) {
  queue.process(async (job) => memoryEngine.store(job.payload.userId, job.payload.content));
  return queue;
}