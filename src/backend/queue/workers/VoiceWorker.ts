import type { QueueLike } from "../InMemoryQueue";

interface VoiceRuntimeLike {
  process(userId: string, audio: Uint8Array, hintText?: string): Promise<any>;
}

export function startVoiceWorker(queue: QueueLike, voiceRuntime: VoiceRuntimeLike) {
  queue.process(async (job) =>
    voiceRuntime.process(job.payload.userId, job.payload.audio, job.payload.hintText),
  );
  return queue;
}