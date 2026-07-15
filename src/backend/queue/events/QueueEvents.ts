import type { QueueLike } from "../InMemoryQueue";
import { sendToDLQ } from "../monitoring/DeadLetterQueue";

export function watch(queue: QueueLike) {
  queue.on("completed", ({ jobId }) => {
    console.log("Completed", jobId);
  });
  queue.on("failed", (result) => {
    console.log("Failed", result.jobId);
    sendToDLQ(result.jobId, result.error ?? "unknown", null);
  });
}