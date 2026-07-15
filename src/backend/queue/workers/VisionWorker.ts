import type { QueueLike } from "../InMemoryQueue";

interface VisionRuntimeLike {
  process(imageUrl: string, prompt?: string): Promise<any>;
}

export function startVisionWorker(queue: QueueLike, visionRuntime: VisionRuntimeLike) {
  queue.process(async (job) => visionRuntime.process(job.payload.imageUrl, job.payload.prompt));
  return queue;
}