// src/recovery/recoveryQueue.ts

import { RecoveryJob, RecoveryStatus } from "./recoveryTypes";

export class RecoveryQueue {
  private jobs: Map<string, RecoveryJob> = new Map();

  createJob(
    id: string,
    targetType: RecoveryJob["targetType"],
    targetId: string,
    failureType: RecoveryJob["failureType"],
    reason: string,
    maxAttempts: number = 3
  ): RecoveryJob {
    const now = new Date().toISOString();

    const job: RecoveryJob = {
      id,
      targetType,
      targetId,
      failureType,
      status: "queued",
      attempts: 0,
      maxAttempts,
      reason,
      createdAt: now,
      updatedAt: now,
    };

    this.jobs.set(id, job);
    return job;
  }

  getJob(id: string): RecoveryJob | undefined {
    return this.jobs.get(id);
  }

  getAllJobs(): RecoveryJob[] {
    return Array.from(this.jobs.values());
  }

  updateJobStatus(id: string, status: RecoveryStatus): RecoveryJob {
    const job = this.jobs.get(id);

    if (!job) {
      throw new Error(`Recovery job not found: ${id}`);
    }

    job.status = status;
    job.updatedAt = new Date().toISOString();
    this.jobs.set(id, job);

    return job;
  }

  incrementAttempts(id: string): RecoveryJob {
    const job = this.jobs.get(id);

    if (!job) {
      throw new Error(`Recovery job not found: ${id}`);
    }

    job.attempts += 1;
    job.updatedAt = new Date().toISOString();
    this.jobs.set(id, job);

    return job;
  }
}
