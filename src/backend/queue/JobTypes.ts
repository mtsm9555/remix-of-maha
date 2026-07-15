export enum JobType {
  AGENT = "agent",
  MEMORY = "memory",
  TOOL = "tool",
  VISION = "vision",
  VOICE = "voice",
  AUTOMATION = "automation",
}

export interface QueueJob<T = any> {
  id: string;
  type: JobType | string;
  payload: T;
  priority?: number;
  attempts?: number;
}

export interface JobResult<T = any> {
  jobId: string;
  success: boolean;
  data?: T;
  error?: string;
  durationMs?: number;
}