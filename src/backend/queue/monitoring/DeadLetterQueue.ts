import { InMemoryQueue } from "../InMemoryQueue";

export const DLQ = new InMemoryQueue("dead-letter");

export function sendToDLQ(jobId: string, reason: string, payload: any) {
  return DLQ.add("failed", { jobId, reason, payload });
}