// src/storage/storageTypes.ts

export type StorageSnapshot = {
  agents: any[];
  tasks: any[];
  goals: any[];
  subtasks: any[];
  memories: any[];
  audits: any[];
  recoveryJobs: any[];
  savedAt: string;
};
