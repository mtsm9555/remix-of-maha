import { InMemoryQueue, type QueueLike } from "./InMemoryQueue";

export class QueueManager {
  create(name: string): QueueLike {
    return new InMemoryQueue(name);
  }
}