import type { QueueLike } from "../InMemoryQueue";

interface OrchestratorLike {
  run(data: any): Promise<any>;
}

export function startAgentWorker(queue: QueueLike, orchestrator: OrchestratorLike) {
  queue.process(async (job) => orchestrator.run(job.payload));
  return queue;
}