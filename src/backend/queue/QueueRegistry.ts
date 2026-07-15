import type { QueueLike } from "./InMemoryQueue";

export class QueueRegistry {
  private queues = new Map<string, QueueLike>();

  register(name: string, queue: QueueLike) {
    this.queues.set(name, queue);
  }

  get(name: string) {
    return this.queues.get(name);
  }

  all() {
    return Array.from(this.queues.values());
  }
}