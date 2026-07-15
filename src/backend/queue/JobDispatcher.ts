import type { QueueLike } from "./InMemoryQueue";

export class JobDispatcher {
  constructor(private queue: QueueLike) {}

  async dispatch(type: string, payload: any) {
    return this.queue.add(type, payload, {
      attempts: 3,
      priority: 0,
    });
  }
}