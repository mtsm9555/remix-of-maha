// src/recovery/recoveryTypes.ts

export type FailureType =
  | "agent_crash"
  | "task_timeout"
  | "permission_error"
  | "state_error"
  | "unknown";

export type RecoveryStatus = "queued" | "running" | "done" | "failed";

export type RecoveryJob = {
  id: string;
  targetType: "agent" | "task" | "system";
  targetId: string;
  failureType: FailureType;
  status: RecoveryStatus;
  attempts: number;
  maxAttempts: number;
  reason: string;
  createdAt: string;
  updatedAt: string;
};
